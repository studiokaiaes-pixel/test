import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft, Check, Eye, Printer, FileDown } from 'lucide-react';
import { storageService } from '../../services/storage';
import { Quote, QuoteLine, ViewMode } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import {
  generateNextId,
  getTodayISO,
  addDaysISO,
  formatCurrency,
  formatDateES,
  calculateLineTotal,
} from '../../utils/formatters';

interface QuoteBuilderProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const company = db.company;

  // Next quote ID: PRE-2026-XXXX
  const nextId = generateNextId(
    'PRE',
    db.quotes.map((q) => q.id),
    true
  );

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form state
  const [clienteId, setClienteId] = useState(db.clients[0]?.id || '');
  const [fecha, setFecha] = useState(getTodayISO());
  const [validez, setValidez] = useState(addDaysISO(30));
  const [condicionesPago, setCondicionesPago] = useState(
    '50% de anticipo al aceptar la propuesta, 50% a la entrega y validación.'
  );
  const [formaPago, setFormaPago] = useState('Transferencia Bancaria');
  const [notas, setNotas] = useState('');

  // Step 3 Lines
  const [lineas, setLineas] = useState<QuoteLine[]>([
    {
      id: '1',
      descripcion: 'Servicio de consultoría y desarrollo técnico',
      cantidad: 1,
      precioUnitario: 2400,
      iva: company.ivaPorDefecto || 21,
      descuento: 0,
    },
  ]);

  // Step 4 Conditions
  const [plazoEntrega, setPlazoEntrega] = useState('8 semanas laborables a partir de la firma.');
  const [revisiones, setRevisiones] = useState('Hasta 2 rondas de revisiones incluidas.');
  const [cancelacion, setCancelacion] = useState(
    'En caso de rescisión, se liquidarán los hitos ejecutados hasta la fecha.'
  );
  const [observaciones, setObservaciones] = useState(
    'Presupuesto confidencial válido durante el plazo estipulado.'
  );

  // Calculations
  const calculated = lineas.reduce(
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

  const handleAddLine = () => {
    const newLine: QuoteLine = {
      id: Date.now().toString(),
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      iva: company.ivaPorDefecto || 21,
      descuento: 0,
    };
    setLineas([...lineas, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    if (lineas.length === 1) {
      onShowToast('error', 'El presupuesto debe contener al menos una línea.');
      return;
    }
    setLineas(lineas.filter((l) => l.id !== id));
  };

  const handleLineChange = (id: string, field: keyof QuoteLine, val: any) => {
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

  const handleSaveQuote = (status: Quote['estado'] = 'Borrador') => {
    if (!clienteId) {
      onShowToast('error', 'Debes seleccionar un cliente.');
      setCurrentStep(1);
      return;
    }
    if (lineas.length === 0 || !lineas[0].descripcion.trim()) {
      onShowToast('error', 'Añade una descripción válida a las líneas del presupuesto.');
      setCurrentStep(3);
      return;
    }

    onShowToast('loading', 'Guardando presupuesto...');

    const today = getTodayISO();
    const newQuote: Quote = {
      id: nextId,
      clienteId,
      fecha,
      validez,
      estado: status,
      lineas,
      subtotal: calculated.subtotal,
      descuentoTotal: calculated.descuentoTotal,
      ivaTotal: calculated.ivaTotal,
      total: calculated.total,
      condicionesPago,
      formaPago,
      plazoEntrega,
      revisiones,
      cancelacion,
      notas,
      observaciones,
      fechaCreacion: today,
      fechaModificacion: today,
    };

    storageService.saveQuote(newQuote);
    onShowToast('success', `Presupuesto ${nextId} guardado con éxito.`);
    onNavigate('quote-detail', nextId);
  };

  const selectedClient = db.clients.find((c) => c.id === clienteId);

  const steps = [
    { num: 1, label: 'Cliente' },
    { num: 2, label: 'Datos' },
    { num: 3, label: 'Líneas' },
    { num: 4, label: 'Condiciones' },
    { num: 5, label: 'Vista Previa' },
  ];

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <BackButton label="Volver a presupuestos" onClick={() => onNavigate('quotes')} />
        <div className="text-xs font-mono text-neutral-400">
          ID Asignado: <span className="text-neutral-900 font-bold">{nextId}</span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white border border-neutral-200 rounded-sm p-4 shadow-xs">
        <div className="grid grid-cols-5 gap-2 text-center">
          {steps.map((step) => {
            const isPassed = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num as any)}
                className={`py-2 px-2 border-b-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer text-left sm:text-center ${
                  isCurrent
                    ? 'border-neutral-950 text-neutral-950 font-bold'
                    : isPassed
                    ? 'border-neutral-400 text-neutral-600'
                    : 'border-neutral-200 text-neutral-300'
                }`}
              >
                <div className="text-[10px] text-neutral-400">PASO {step.num}</div>
                <div className="truncate">{step.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Cards */}
      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        {/* PASO 1: SELECCIONAR CLIENTE */}
        {currentStep === 1 && (
          <div className="p-6 space-y-6 animate-in fade-in duration-75">
            <div className="border-b border-neutral-200 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-950">Paso 1: Seleccionar Cliente</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Elige el cliente destinatario o crea uno nuevo en la base de datos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('client-new')}
                className="px-3 py-1.5 text-xs font-mono uppercase text-neutral-950 border border-neutral-300 hover:border-neutral-950 rounded-sm cursor-pointer"
              >
                + Crear nuevo cliente
              </button>
            </div>

            {db.clients.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-neutral-300 rounded-sm">
                <p className="text-xs text-neutral-600">No hay clientes registrados en KAIA.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('client-new')}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold uppercase text-white bg-neutral-950 rounded-sm"
                >
                  Crear cliente ahora
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-xs font-medium text-neutral-800">
                  Selecciona el cliente para este presupuesto:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {db.clients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setClienteId(c.id)}
                      className={`p-3 border rounded-sm cursor-pointer transition-colors ${
                        clienteId === c.id
                          ? 'border-neutral-950 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs">{c.empresa || `${c.nombre} ${c.apellidos}`}</span>
                        <span className={`text-[10px] font-mono ${clienteId === c.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {c.id}
                        </span>
                      </div>
                      <div className={`text-[11px] mt-1 ${clienteId === c.id ? 'text-neutral-300' : 'text-neutral-600'}`}>
                        NIF/CIF: {c.cif || 'Sin CIF'} · {c.email}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!clienteId}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer disabled:opacity-50"
              >
                <span>Continuar a datos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: DATOS DEL PRESUPUESTO */}
        {currentStep === 2 && (
          <div className="p-6 space-y-6 animate-in fade-in duration-75">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-base font-bold text-neutral-950">Paso 2: Datos del Presupuesto</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Fechas de emisión, validez y términos generales de cobro.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Número de Presupuesto
                </label>
                <input
                  type="text"
                  disabled
                  value={nextId}
                  className="w-full text-xs px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-sm font-mono font-bold text-neutral-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Cliente Seleccionado
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedClient ? `${selectedClient.empresa || selectedClient.nombre} (${selectedClient.id})` : ''}
                  className="w-full text-xs px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-sm text-neutral-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Fecha de Emisión
                </label>
                <input
                  type="date"
                  value={fecha ?? ''}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Validez de la Oferta
                </label>
                <input
                  type="date"
                  value={validez ?? ''}
                  onChange={(e) => setValidez(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Forma de Pago
                </label>
                <input
                  type="text"
                  value={formaPago ?? ''}
                  onChange={(e) => setFormaPago(e.target.value)}
                  placeholder="Ej: Transferencia Bancaria"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Condiciones de Pago
                </label>
                <input
                  type="text"
                  value={condicionesPago ?? ''}
                  onChange={(e) => setCondicionesPago(e.target.value)}
                  placeholder="Ej: 50% anticipo, 50% al finalizar"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Notas Internas del Presupuesto
                </label>
                <textarea
                  rows={2}
                  value={notas ?? ''}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas internas que no aparecerán en el documento final..."
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 rounded-sm"
              >
                Paso anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer"
              >
                <span>Continuar a líneas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: AÑADIR LÍNEAS */}
        {currentStep === 3 && (
          <div className="p-6 space-y-6 animate-in fade-in duration-75">
            <div className="border-b border-neutral-200 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-950">Paso 3: Partidas y Líneas</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Los cálculos de base, IVA y totales se actualizan en tiempo real.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir línea</span>
              </button>
            </div>

            {/* Lines List */}
            <div className="space-y-3">
              {lineas.map((line, index) => {
                const lineCalc = calculateLineTotal(
                  line.cantidad,
                  line.precioUnitario,
                  line.iva,
                  line.descuento
                );

                return (
                  <div
                    key={line.id}
                    className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                  >
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                        Descripción de la Partida #{index + 1}
                      </label>
                      <input
                        type="text"
                        value={line.descripcion ?? ''}
                        onChange={(e) => handleLineChange(line.id, 'descripcion', e.target.value)}
                        placeholder="Concepto o servicio detallado..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-neutral-300 rounded-sm focus:outline-hidden focus:border-neutral-950"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.cantidad ?? 1}
                        onChange={(e) => handleLineChange(line.id, 'cantidad', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-neutral-300 rounded-sm focus:outline-hidden focus:border-neutral-950 font-mono"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                        Precio Unit. (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.precioUnitario ?? 0}
                        onChange={(e) => handleLineChange(line.id, 'precioUnitario', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-neutral-300 rounded-sm focus:outline-hidden focus:border-neutral-950 font-mono"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                        IVA %
                      </label>
                      <input
                        type="number"
                        value={line.iva ?? 21}
                        onChange={(e) => handleLineChange(line.id, 'iva', e.target.value)}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-neutral-300 rounded-sm focus:outline-hidden focus:border-neutral-950 font-mono"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                        Desc %
                      </label>
                      <input
                        type="number"
                        value={line.descuento ?? 0}
                        onChange={(e) => handleLineChange(line.id, 'descuento', e.target.value)}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-neutral-300 rounded-sm focus:outline-hidden focus:border-neutral-950 font-mono"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0">
                      <div className="text-right font-mono font-bold text-xs text-neutral-900 md:hidden">
                        Total: {formatCurrency(lineCalc.total)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-200 rounded-sm cursor-pointer"
                        title="Eliminar línea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total summary breakdown */}
            <div className="p-4 bg-neutral-100 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-neutral-500">Subtotal bruto:</span>{' '}
                  <span className="font-mono font-medium text-neutral-900">{formatCurrency(calculated.subtotal)}</span>
                </div>
                {calculated.descuentoTotal > 0 && (
                  <div>
                    <span className="text-neutral-500">Descuentos aplicados:</span>{' '}
                    <span className="font-mono font-medium text-neutral-900">-{formatCurrency(calculated.descuentoTotal)}</span>
                  </div>
                )}
                <div>
                  <span className="text-neutral-500">Base Imponible:</span>{' '}
                  <span className="font-mono font-medium text-neutral-900">{formatCurrency(calculated.baseImponible)}</span>
                </div>
                <div>
                  <span className="text-neutral-500">IVA Total:</span>{' '}
                  <span className="font-mono font-medium text-neutral-900">{formatCurrency(calculated.ivaTotal)}</span>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-neutral-300 sm:pl-6">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">TOTAL PRESUPUESTO</span>
                <span className="text-2xl font-bold font-mono text-neutral-950">
                  {formatCurrency(calculated.total)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 rounded-sm"
              >
                Paso anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer"
              >
                <span>Continuar a condiciones</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: CONDICIONES */}
        {currentStep === 4 && (
          <div className="p-6 space-y-6 animate-in fade-in duration-75">
            <div className="border-b border-neutral-200 pb-4">
              <h2 className="text-base font-bold text-neutral-950">Paso 4: Cláusulas y Condiciones</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configura los términos de entrega, revisiones y aceptación formal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Plazo de Ejecución / Entrega
                </label>
                <input
                  type="text"
                  value={plazoEntrega ?? ''}
                  onChange={(e) => setPlazoEntrega(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Revisiones Incluidas
                </label>
                <input
                  type="text"
                  value={revisiones ?? ''}
                  onChange={(e) => setRevisiones(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Política de Cancelación
                </label>
                <input
                  type="text"
                  value={cancelacion ?? ''}
                  onChange={(e) => setCancelacion(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Observaciones y Consideraciones
                </label>
                <textarea
                  rows={3}
                  value={observaciones ?? ''}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 rounded-sm"
              >
                Paso anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer"
              >
                <span>Ver vista previa del documento</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 5: VISTA PREVIA DEL DOCUMENTO */}
        {currentStep === 5 && (
          <div className="p-6 space-y-6 animate-in fade-in duration-75">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-950">Paso 5: Vista Previa del Documento</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Revisa el formato formal antes de guardar, generar el PDF o emitir la propuesta.
                </p>
              </div>

              {/* Botones de acción requeridos: Guardar borrador, Guardar y generar PDF, Guardar y enviar, Volver */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-sm cursor-pointer"
                >
                  Volver al editor
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuote('Borrador')}
                  className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-800 bg-white border border-neutral-300 hover:border-neutral-950 rounded-sm cursor-pointer shadow-xs"
                >
                  Guardar borrador
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveQuote('Borrador');
                    window.print();
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-950 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-sm cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Guardar y generar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuote('Enviado')}
                  className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
                >
                  Guardar y enviar
                </button>
              </div>
            </div>

            {/* Document Sheet (Styled according to corporate guidelines) */}
            <div className="border border-neutral-300 p-8 sm:p-12 bg-white rounded-sm shadow-sm space-y-8 font-sans max-w-3xl mx-auto">
              {/* Document Header */}
              <div className="flex justify-between items-start border-b border-neutral-900 pb-6">
                <div>
                  <h1 className="text-3xl font-bold font-mono tracking-widest text-neutral-950">
                    {company.nombreComercial || 'KAIA'}
                  </h1>
                  <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mt-1">
                    PRESUPUESTO COMERCIAL
                  </p>
                  <div className="text-xs text-neutral-600 mt-3 space-y-0.5">
                    <p className="font-semibold text-neutral-900">{company.razonSocial}</p>
                    <p>CIF: {company.cif}</p>
                    <p>{company.direccion}</p>
                    <p>{company.codigoPostal} {company.ciudad}, {company.provincia} ({company.pais})</p>
                    <p>Email: {company.email} · Tel: {company.telefono}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-neutral-950 text-white font-mono text-xs px-3 py-1 font-bold">
                    {nextId}
                  </div>
                  <div className="text-xs text-neutral-600 mt-3 space-y-1 font-mono">
                    <p>
                      <span className="text-neutral-400">Fecha:</span> {formatDateES(fecha)}
                    </p>
                    <p>
                      <span className="text-neutral-400">Validez:</span> {formatDateES(validez)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Block */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                  DATOS DEL CLIENTE / RECEPTOR
                </span>
                {selectedClient ? (
                  <div className="text-xs text-neutral-800 space-y-0.5">
                    <p className="font-bold text-sm text-neutral-950">
                      {selectedClient.empresa || `${selectedClient.nombre} ${selectedClient.apellidos}`}
                    </p>
                    <p>Atn: {selectedClient.nombre} {selectedClient.apellidos}</p>
                    <p>NIF/CIF: {selectedClient.cif || 'No especificado'}</p>
                    <p>{selectedClient.direccion} {selectedClient.codigoPostal} {selectedClient.ciudad}</p>
                    <p>{selectedClient.email} · {selectedClient.telefono}</p>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">Sin cliente seleccionado.</p>
                )}
              </div>

              {/* Table of lines: Descripción | Cantidad | Precio | IVA | Total */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-neutral-900 text-neutral-900 font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-2.5">Descripción</th>
                      <th className="py-2.5 text-center">Cant.</th>
                      <th className="py-2.5 text-right">Precio Unit.</th>
                      <th className="py-2.5 text-right">IVA</th>
                      <th className="py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {lineas.map((line) => {
                      const lCalc = calculateLineTotal(
                        line.cantidad,
                        line.precioUnitario,
                        line.iva,
                        line.descuento
                      );
                      return (
                        <tr key={line.id} className="py-2">
                          <td className="py-2.5 pr-2 font-medium text-neutral-900">
                            {line.descripcion || '—'}
                          </td>
                          <td className="py-2.5 text-center font-mono text-neutral-700">
                            {line.cantidad}
                          </td>
                          <td className="py-2.5 text-right font-mono text-neutral-700">
                            {formatCurrency(line.precioUnitario)}
                          </td>
                          <td className="py-2.5 text-right font-mono text-neutral-500">
                            {line.iva}%
                          </td>
                          <td className="py-2.5 text-right font-mono font-semibold text-neutral-900">
                            {formatCurrency(lCalc.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Subtotal, IVA, Total */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs text-neutral-700">
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(calculated.subtotal)}</span>
                  </div>
                  {calculated.descuentoTotal > 0 && (
                    <div className="flex justify-between py-1 border-b border-neutral-200">
                      <span>Descuento</span>
                      <span className="font-mono">-{formatCurrency(calculated.descuentoTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span>Base Imponible</span>
                    <span className="font-mono">{formatCurrency(calculated.baseImponible)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200">
                    <span>IVA Total</span>
                    <span className="font-mono">{formatCurrency(calculated.ivaTotal)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-neutral-950 font-bold text-sm text-neutral-950">
                    <span>TOTAL</span>
                    <span className="font-mono">{formatCurrency(calculated.total)}</span>
                  </div>
                </div>
              </div>

              {/* Conditions & Notes */}
              <div className="pt-4 border-t border-neutral-200 space-y-3 text-xs text-neutral-700">
                <h3 className="font-mono text-[10px] uppercase font-bold tracking-wider text-neutral-900">
                  CONDICIONES GENERALES
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="font-semibold text-neutral-900">Forma de pago:</span> {formaPago}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">Condiciones:</span> {condicionesPago}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">Plazo de entrega:</span> {plazoEntrega}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-900">Revisiones:</span> {revisiones}
                  </div>
                </div>
                {cancelacion && (
                  <div className="pt-1">
                    <span className="font-semibold text-neutral-900">Cancelación:</span> {cancelacion}
                  </div>
                )}
                {observaciones && (
                  <div className="pt-1 italic text-neutral-600">
                    Observaciones: {observaciones}
                  </div>
                )}
              </div>

              {/* Aceptación y Firma */}
              <div className="pt-8 border-t border-neutral-200 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <p className="font-mono text-[10px] text-neutral-500 uppercase">Por el emisor:</p>
                  <p className="font-semibold text-neutral-900 mt-1">{company.razonSocial}</p>
                  <div className="h-16 border-b border-neutral-300 mt-4"></div>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-neutral-500 uppercase">Conforme y Aceptado por el Cliente:</p>
                  <p className="font-semibold text-neutral-900 mt-1">
                    {selectedClient?.empresa || selectedClient?.nombre || 'El Cliente'}
                  </p>
                  <div className="h-16 border-b border-neutral-300 mt-4"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
