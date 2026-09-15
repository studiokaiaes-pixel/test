import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Receipt,
  Calendar,
  DollarSign,
  Trash2,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { FinanceMovement, ViewMode } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatDateES, getTodayISO } from '../../utils/formatters';

interface FinancesPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const FinancesPage: React.FC<FinancesPageProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const [activeTab, setActiveTab] = useState<'movimientos' | 'ingresos' | 'gastos' | 'previsiones'>('movimientos');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New movement form state
  const [tipo, setTipo] = useState<'Ingreso' | 'Gasto'>('Ingreso');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('Ventas');
  const [importe, setImporte] = useState<number>(0);
  const [fecha, setFecha] = useState(getTodayISO());
  const [clienteId, setClienteId] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [metodoPago, setMetodoPago] = useState('Transferencia Bancaria');
  const [estado, setEstado] = useState<'Completado' | 'Pendiente'>('Completado');

  // Metrics
  const totalIngresos = db.finances
    .filter((f) => f.tipo === 'Ingreso' && f.estado === 'Completado')
    .reduce((acc, curr) => acc + curr.importe, 0);

  const totalGastos = db.finances
    .filter((f) => f.tipo === 'Gasto' && f.estado === 'Completado')
    .reduce((acc, curr) => acc + curr.importe, 0);

  const beneficioNeto = totalIngresos - totalGastos;

  const pendientesCobro = db.invoices
    .filter((i) => i.estado === 'Emitida' || i.estado === 'Parcial' || i.estado === 'Vencida')
    .reduce((acc, curr) => acc + curr.importePendiente, 0);

  const pendientesPago = db.finances
    .filter((f) => f.tipo === 'Gasto' && f.estado === 'Pendiente')
    .reduce((acc, curr) => acc + curr.importe, 0);

  // Filtered movements based on tab & search
  const filteredMovements = db.finances.filter((m) => {
    if (activeTab === 'ingresos' && m.tipo !== 'Ingreso') return false;
    if (activeTab === 'gastos' && m.tipo !== 'Gasto') return false;

    const matches =
      (m.concepto || m.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matches;
  });

  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || importe <= 0) {
      onShowToast('error', 'Introduce concepto e importe válido.');
      return;
    }

    const newMov: FinanceMovement = {
      id: `${tipo === 'Ingreso' ? 'ING' : 'GAS'}-${Date.now().toString().slice(-4)}`,
      tipo,
      concepto: concepto.trim(),
      descripcion: concepto.trim(),
      categoria,
      importe,
      fecha,
      clienteId: clienteId || undefined,
      proveedorId: proveedorId || undefined,
      metodoPago,
      metodo: metodoPago,
      estado,
    };

    storageService.saveFinance(newMov);
    setShowAddForm(false);
    setConcepto('');
    setImporte(0);
    onShowToast('success', 'Movimiento registrado correctamente en finanzas.');
  };

  const handleDeleteMovement = (id: string) => {
    storageService.deleteFinance(id);
    onShowToast('success', 'Movimiento eliminado.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Finanzas</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Libro de caja, control de cobros, costes operativos y previsiones de liquidez.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Cerrar formulario' : 'Añadir movimiento'}</span>
        </button>
      </div>

      {/* Top 5 KPI Cards: Total ingresos, Total gastos, Beneficio neto, Facturas pendientes de cobro, Facturas pendientes de pago */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white border border-neutral-200 rounded-sm shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Ingresos</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-900" />
          </div>
          <div className="text-xl font-bold font-mono text-neutral-950">{formatCurrency(totalIngresos)}</div>
          <div className="text-[10px] text-neutral-400 mt-1">Cobros percibidos</div>
        </div>

        <div className="p-4 bg-white border border-neutral-200 rounded-sm shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Total Gastos</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-neutral-600" />
          </div>
          <div className="text-xl font-bold font-mono text-neutral-950">{formatCurrency(totalGastos)}</div>
          <div className="text-[10px] text-neutral-400 mt-1">Costes pagados</div>
        </div>

        <div className="p-4 bg-neutral-950 text-white rounded-sm shadow-xs border border-neutral-900">
          <div className="flex items-center justify-between text-neutral-400 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Beneficio Neto</span>
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{formatCurrency(beneficioNeto)}</div>
          <div className="text-[10px] text-neutral-400 mt-1">Ingresos - Gastos</div>
        </div>

        <div className="p-4 bg-white border border-neutral-200 rounded-sm shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Pend. de Cobro</span>
            <Receipt className="w-3.5 h-3.5 text-neutral-900" />
          </div>
          <div className="text-xl font-bold font-mono text-neutral-950">{formatCurrency(pendientesCobro)}</div>
          <div className="text-[10px] text-neutral-400 mt-1">Facturas a clientes</div>
        </div>

        <div className="p-4 bg-white border border-neutral-200 rounded-sm shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider">Pend. de Pago</span>
            <Calendar className="w-3.5 h-3.5 text-neutral-600" />
          </div>
          <div className="text-xl font-bold font-mono text-neutral-950">{formatCurrency(pendientesPago)}</div>
          <div className="text-[10px] text-neutral-400 mt-1">Gastos comprometidos</div>
        </div>
      </div>

      {/* Formulario para añadir movimiento */}
      {showAddForm && (
        <div className="bg-white border border-neutral-950 p-6 rounded-sm shadow-sm space-y-4 animate-in fade-in duration-100">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-950">
              REGISTRAR NUEVO MOVIMIENTO
            </h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-mono text-neutral-400 hover:text-neutral-950"
            >
              CERRAR
            </button>
          </div>

          <form onSubmit={handleCreateMovement} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-semibold"
              >
                <option value="Ingreso">Ingreso (+)</option>
                <option value="Gasto">Gasto (-)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">Concepto *</label>
              <input
                type="text"
                value={concepto ?? ''}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Licencias software anuales / Anticipo proyecto"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Importe (€) *</label>
              <input
                type="number"
                step="0.01"
                value={importe ?? 0}
                onChange={(e) => setImporte(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Categoría</label>
              <input
                type="text"
                value={categoria ?? ''}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ej: Infraestructura / Ventas / Nóminas"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha ?? ''}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Método de Pago</label>
              <select
                value={metodoPago ?? 'Transferencia Bancaria'}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Domiciliación">Domiciliación</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Estado</label>
              <select
                value={estado ?? 'Completado'}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              >
                <option value="Completado">Completado</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>

            <div className="flex items-end justify-end md:col-span-1">
              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
              >
                Guardar Movimiento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs & Table */}
      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        {/* Pestañas: Movimientos, Ingresos, Gastos, Previsiones */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 bg-neutral-50/60 overflow-x-auto">
          <div className="flex">
            {(['movimientos', 'ingresos', 'gastos', 'previsiones'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-neutral-950 text-neutral-950 font-bold bg-white'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative my-2 w-64 hidden sm:block">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm ?? ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar movimientos..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-neutral-200 rounded-sm"
            />
          </div>
        </div>

        {activeTab === 'previsiones' ? (
          <div className="p-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-neutral-950">Previsiones de Flujo de Caja</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Estimación de liquidez calculada a partir de los vencimientos de facturas emitidas y costes comprometidos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                  Saldo Disponible Real
                </span>
                <div className="text-2xl font-bold font-mono text-neutral-950">
                  {formatCurrency(beneficioNeto)}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Caja neta consolidada</div>
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">
                  Cobros Estimados (Próximos 30-60 días)
                </span>
                <div className="text-2xl font-bold font-mono text-neutral-950">
                  +{formatCurrency(pendientesCobro)}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">{db.invoices.filter(i => i.importePendiente > 0).length} facturas emitidas</div>
              </div>

              <div className="p-4 bg-neutral-950 text-white rounded-sm">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">
                  Liquidez Estimada Proyectada
                </span>
                <div className="text-2xl font-bold font-mono text-white">
                  {formatCurrency(beneficioNeto + pendientesCobro - pendientesPago)}
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Escenario a cierre de ciclo</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredMovements.length === 0 ? (
              <EmptyState
                message="Sin movimientos financieros registrados."
                description="Registra ingresos o gastos para llevar la contabilidad al día."
                actionLabel="Añadir movimiento"
                onAction={() => setShowAddForm(true)}
              />
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Concepto</th>
                    <th className="px-4 py-3 text-right">Importe</th>
                    <th className="px-4 py-3">Método</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-neutral-600 whitespace-nowrap">
                        {formatDateES(mov.fecha)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded font-bold ${
                            mov.tipo === 'Ingreso'
                              ? 'bg-neutral-950 text-white'
                              : 'bg-neutral-200 text-neutral-900'
                          }`}
                        >
                          {mov.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 font-medium">
                        {mov.categoria}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-950">
                        {mov.concepto || mov.descripcion}
                        {mov.facturaId && (
                          <span className="text-[10px] text-neutral-400 font-mono ml-2">
                            ({mov.facturaId})
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                          mov.tipo === 'Ingreso' ? 'text-neutral-950' : 'text-neutral-600'
                        }`}
                      >
                        {mov.tipo === 'Ingreso' ? '+' : '-'}
                        {formatCurrency(mov.importe)}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 font-mono text-[11px]">
                        {mov.metodoPago || mov.metodo || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={mov.estado} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteMovement(mov.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-950 rounded-sm cursor-pointer"
                          title="Eliminar movimiento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
