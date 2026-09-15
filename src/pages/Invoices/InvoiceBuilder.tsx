import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, Printer, Sparkles } from 'lucide-react';
import { storageService } from '../../services/storage';
import { Invoice, InvoiceLine, ViewMode } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import {
  generateNextId,
  getTodayISO,
  addDaysISO,
  formatCurrency,
  formatDateES,
  calculateLineTotal,
} from '../../utils/formatters';

interface InvoiceBuilderProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const company = db.company;

  const nextId = generateNextId(
    'FAC',
    db.invoices.map((i) => i.id),
    true
  );

  const [clienteId, setClienteId] = useState(db.clients[0]?.id || '');
  const [presupuestoId, setPresupuestoId] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [fechaEmision, setFechaEmision] = useState(getTodayISO());
  const [fechaVencimiento, setFechaVencimiento] = useState(addDaysISO(30));
  const [metodoPago, setMetodoPago] = useState('Transferencia Bancaria');
  const [irpfPorcentaje, setIrpfPorcentaje] = useState(company.retencionIRPF || 0);
  const [notas, setNotas] = useState('');

  const [lineas, setLineas] = useState<InvoiceLine[]>([
    {
      id: '1',
      descripcion: 'Servicios profesionales prestados según acuerdo',
      cantidad: 1,
      precioUnitario: 1500,
      iva: company.ivaPorDefecto || 21,
      descuento: 0,
    },
  ]);

  // Import lines from existing quote if selected
  const handleSelectQuote = (quoteId: string) => {
    setPresupuestoId(quoteId);
    if (!quoteId) return;

    const q = db.quotes.find((item) => item.id === quoteId);
    if (q) {
      setClienteId(q.clienteId);
      if (q.lineas && q.lineas.length > 0) {
        setLineas(
          q.lineas.map((l, idx) => ({
            id: (idx + 1).toString(),
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            iva: l.iva,
            descuento: l.descuento,
          }))
        );
      }
      onShowToast('success', `Líneas importadas del presupuesto ${q.id}.`);
    }
  };

  const handleAddLine = () => {
    setLineas([
      ...lineas,
      {
        id: Date.now().toString(),
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        iva: company.ivaPorDefecto || 21,
        descuento: 0,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lineas.length === 1) {
      onShowToast('error', 'La factura debe tener al menos una partida.');
      return;
    }
    setLineas(lineas.filter((l) => l.id !== id));
  };

  const handleLineChange = (id: string, field: keyof InvoiceLine, val: any) => {
    setLineas(
      lineas.map((l) => {
        if (l.id !== id) return l;
        return {
          ...l,
          [field]:
            field === 'cantidad' || field === 'precioUnitario' || field === 'iva' || field === 'descuento'
              ? parseFloat(val) || 0
              : val,
        };
      })
    );
  };

  // Financial calculations
  const rawCalculations = lineas.reduce(
    (acc, line) => {
      const { subtotal, descuentoAmount, baseImponible, ivaAmount, total } = calculateLineTotal(
        line.cantidad,
        line.precioUnitario,
        line.iva,
        line.descuento
      );
      return {
        subtotal: acc.subtotal + subtotal,
        descuentoTotal: acc.descuentoTotal + descuentoAmount,
        baseImponible: acc.baseImponible + baseImponible,
        ivaTotal: acc.ivaTotal + ivaAmount,
        total: acc.total + total,
      };
    },
    { subtotal: 0, descuentoTotal: 0, baseImponible: 0, ivaTotal: 0, total: 0 }
  );

  const irpfTotal =
    irpfPorcentaje > 0 ? (rawCalculations.baseImponible * irpfPorcentaje) / 100 : 0;
  const finalTotal = rawCalculations.baseImponible + rawCalculations.ivaTotal - irpfTotal;

  const handleSaveInvoice = (status: Invoice['estado'] = 'Emitida') => {
    if (!clienteId) {
      onShowToast('error', 'Selecciona el cliente emisor.');
      return;
    }
    if (lineas.length === 0 || !lineas[0].descripcion.trim()) {
      onShowToast('error', 'Completa los conceptos de la factura.');
      return;
    }

    onShowToast('loading', 'Generando factura oficial...');

    const today = getTodayISO();
    const newInvoice: Invoice = {
      id: nextId,
      numero: nextId,
      serie: '2026',
      clienteId,
      proyectoId: proyectoId || undefined,
      presupuestoId: presupuestoId || undefined,
      fechaEmision,
      fechaVencimiento,
      estado: status,
      lineas,
      baseImponible: rawCalculations.baseImponible,
      ivaTotal: rawCalculations.ivaTotal,
      irpfTotal,
      total: finalTotal,
      importePagado: 0,
      importePendiente: finalTotal,
      metodoPago,
      cuentaBancaria: company.cuentaBancaria || company.iban,
      notas,
      fechaCreacion: today,
      fechaModificacion: today,
    };

    storageService.saveInvoice(newInvoice);
    onShowToast('success', `Factura ${nextId} creada correctamente.`);
    onNavigate('invoice-detail', nextId);
  };

  const selectedClient = db.clients.find((c) => c.id === clienteId);

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <BackButton label="Volver a facturas" onClick={() => onNavigate('invoices')} />
        <div className="text-xs font-mono text-neutral-400">
          Factura Correlativa: <span className="text-neutral-900 font-bold">{nextId}</span>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-950">Nueva Factura</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Completa los datos fiscales para emitir la factura correlativa legal de KAIA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveInvoice('Borrador')}
              className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-800 bg-white border border-neutral-300 hover:border-neutral-950 rounded-sm cursor-pointer shadow-xs"
            >
              Guardar borrador
            </button>
            <button
              type="button"
              onClick={() => handleSaveInvoice('Emitida')}
              className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
            >
              Emitir factura
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Opción de facturar a partir de presupuesto existente */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-neutral-700" />
              <span className="text-xs font-mono uppercase font-bold tracking-wider text-neutral-900">
                FACTURAR A PARTIR DE UN PRESUPUESTO EXISTENTE (OPCIONAL)
              </span>
            </div>
            <select
              value={presupuestoId ?? ''}
              onChange={(e) => handleSelectQuote(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-neutral-300 rounded-sm focus:outline-hidden focus:border-neutral-950 cursor-pointer"
            >
              <option value="">Selecciona un presupuesto si deseas volcar sus líneas automáticamente...</option>
              {db.quotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.id} — Total: {q.total.toFixed(2)} € (Estado: {q.estado})
                </option>
              ))}
            </select>
          </div>

          {/* Datos Generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Cliente Receptor *
              </label>
              <select
                value={clienteId ?? ''}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 cursor-pointer"
              >
                {db.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.empresa || `${c.nombre} ${c.apellidos}`} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Proyecto Asociado (Opcional)
              </label>
              <select
                value={proyectoId ?? ''}
                onChange={(e) => setProyectoId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 cursor-pointer"
              >
                <option value="">Sin proyecto asociado</option>
                {db.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Método de Cobro
              </label>
              <input
                type="text"
                value={metodoPago ?? ''}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Fecha de Emisión
              </label>
              <input
                type="date"
                value={fechaEmision ?? ''}
                onChange={(e) => setFechaEmision(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={fechaVencimiento ?? ''}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Retención IRPF (%)
              </label>
              <input
                type="number"
                value={irpfPorcentaje ?? 0}
                onChange={(e) => setIrpfPorcentaje(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
              />
            </div>
          </div>

          {/* Líneas de Factura */}
          <div className="pt-4 border-t border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-800 uppercase">
                CONCEPTOS DE LA FACTURA
              </h2>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir concepto</span>
              </button>
            </div>

            <div className="space-y-3">
              {lineas.map((line, idx) => {
                const lineCalc = calculateLineTotal(
                  line.cantidad,
                  line.precioUnitario,
                  line.iva,
                  line.descuento
                );

                return (
                  <div
                    key={line.id}
                    className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                  >
                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                        Concepto #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={line.descripcion ?? ''}
                        onChange={(e) => handleLineChange(line.id, 'descripcion', e.target.value)}
                        placeholder="Descripción del concepto facturable..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-neutral-300 rounded-sm focus:outline-hidden focus:border-neutral-950"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                        Cant.
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.cantidad ?? 1}
                        onChange={(e) => handleLineChange(line.id, 'cantidad', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-neutral-300 rounded-sm font-mono"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                        Precio (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.precioUnitario ?? 0}
                        onChange={(e) => handleLineChange(line.id, 'precioUnitario', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-neutral-300 rounded-sm font-mono"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                        IVA %
                      </label>
                      <input
                        type="number"
                        value={line.iva ?? 21}
                        onChange={(e) => handleLineChange(line.id, 'iva', e.target.value)}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-neutral-300 rounded-sm font-mono"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-center justify-end pt-3 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-200 rounded-sm cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 bg-neutral-100 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-neutral-500">Base Imponible:</span>{' '}
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(rawCalculations.baseImponible)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">IVA Repercutido:</span>{' '}
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(rawCalculations.ivaTotal)}
                  </span>
                </div>
                {irpfTotal > 0 && (
                  <div>
                    <span className="text-neutral-500">Retención IRPF ({irpfPorcentaje}%):</span>{' '}
                    <span className="font-mono font-medium text-neutral-900">
                      -{formatCurrency(irpfTotal)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right sm:border-l sm:border-neutral-300 sm:pl-6">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">TOTAL FACTURA</span>
                <span className="text-2xl font-bold font-mono text-neutral-950">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Notas y Términos Legales al Pie
              </label>
              <textarea
                rows={2}
                value={notas ?? ''}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Datos de registro mercantil, exenciones o instrucciones bancarias..."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('invoices')}
              className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-sm cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSaveInvoice('Emitida')}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer transition-colors shadow-xs"
            >
              Guardar y emitir factura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
