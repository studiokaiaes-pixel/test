import React from 'react';
import {
  Users,
  FolderKanban,
  FileText,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ArrowRight,
  History,
} from 'lucide-react';
import { storageService } from '../services/storage';
import { ViewMode } from '../types';
import { formatCurrency, formatDateTimeES } from '../utils/formatters';

interface DashboardProps {
  onNavigate: (view: ViewMode, id?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const db = storageService.getDatabase();

  // Metrics calculation based on real database records
  const totalClients = db.clients.length;

  const activeProjects = db.projects.filter(
    (p) => p.estado === 'En curso' || p.estado === 'En preparación' || p.estado === 'En revisión'
  ).length;

  const pendingQuotes = db.quotes.filter(
    (q) => q.estado === 'Borrador' || q.estado === 'Enviado'
  ).length;

  const pendingInvoices = db.invoices.filter(
    (i) => i.estado === 'Emitida' || i.estado === 'Parcial' || i.estado === 'Vencida'
  ).length;

  const totalIncome = db.finances
    .filter((m) => m.tipo === 'Ingreso' && m.estado === 'Completado')
    .reduce((acc, curr) => acc + curr.importe, 0);

  const totalExpense = db.finances
    .filter((m) => m.tipo === 'Gasto' && m.estado === 'Completado')
    .reduce((acc, curr) => acc + curr.importe, 0);

  const netResult = totalIncome - totalExpense;

  const recentActivities = db.activities.slice(0, 8);

  return (
    <div className="space-y-8 animate-in fade-in duration-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Inicio</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Resumen de actividad de KAIA.</p>
        </div>

        {/* Quick actions without modals */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('client-new')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-800 bg-white border border-neutral-300 hover:border-neutral-900 rounded-sm cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo cliente</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('quote-builder')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo presupuesto</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Clientes */}
        <div
          onClick={() => onNavigate('clients')}
          className="p-4 bg-white border border-neutral-200 rounded-sm hover:border-neutral-400 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Clientes</span>
            <Users className="w-4 h-4 text-neutral-500 group-hover:text-neutral-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950">{totalClients}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Registrados en sistema</div>
        </div>

        {/* Proyectos activos */}
        <div
          onClick={() => onNavigate('projects')}
          className="p-4 bg-white border border-neutral-200 rounded-sm hover:border-neutral-400 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Proyectos activos</span>
            <FolderKanban className="w-4 h-4 text-neutral-500 group-hover:text-neutral-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950">{activeProjects}</div>
          <div className="text-[11px] text-neutral-400 mt-1">{db.projects.length} totales en cartera</div>
        </div>

        {/* Presupuestos pendientes */}
        <div
          onClick={() => onNavigate('quotes')}
          className="p-4 bg-white border border-neutral-200 rounded-sm hover:border-neutral-400 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Presupuestos pendientes</span>
            <FileText className="w-4 h-4 text-neutral-500 group-hover:text-neutral-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950">{pendingQuotes}</div>
          <div className="text-[11px] text-neutral-400 mt-1">{db.quotes.length} generados en total</div>
        </div>

        {/* Facturas pendientes */}
        <div
          onClick={() => onNavigate('invoices')}
          className="p-4 bg-white border border-neutral-200 rounded-sm hover:border-neutral-400 transition-colors cursor-pointer group shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Facturas pendientes</span>
            <Receipt className="w-4 h-4 text-neutral-500 group-hover:text-neutral-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950">{pendingInvoices}</div>
          <div className="text-[11px] text-neutral-400 mt-1">{db.invoices.length} emitidas en total</div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Ingresos */}
        <div
          onClick={() => onNavigate('finances')}
          className="p-4 bg-white border border-neutral-200 rounded-sm hover:border-neutral-400 transition-colors cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Ingresos</span>
            <ArrowUpRight className="w-4 h-4 text-neutral-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950">{formatCurrency(totalIncome)}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Cobros conciliados</div>
        </div>

        {/* Gastos */}
        <div
          onClick={() => onNavigate('finances')}
          className="p-4 bg-white border border-neutral-200 rounded-sm hover:border-neutral-400 transition-colors cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Gastos</span>
            <ArrowDownRight className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950">{formatCurrency(totalExpense)}</div>
          <div className="text-[11px] text-neutral-400 mt-1">Costes operativos y compras</div>
        </div>

        {/* Resultado */}
        <div
          onClick={() => onNavigate('finances')}
          className="p-4 bg-neutral-950 text-white rounded-sm shadow-xs border border-neutral-900 cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Resultado Neto</span>
            <span className="text-[10px] font-mono border border-neutral-700 px-1.5 py-0.5 rounded text-neutral-300">
              INGRESOS - GASTOS
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {formatCurrency(netResult)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Balance operativo acumulado</div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-500" />
            <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-800 uppercase">
              ACTIVIDAD RECIENTE
            </h2>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {recentActivities.length} eventos registrados
          </span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-400">Sin actividad registrada todavía.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => {
                  if (act.targetView) {
                    onNavigate(act.targetView, act.targetId);
                  }
                }}
                className={`p-3.5 flex items-center justify-between transition-colors ${
                  act.targetView ? 'hover:bg-neutral-50 cursor-pointer group' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-neutral-400 group-hover:bg-neutral-900 transition-colors shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 group-hover:text-neutral-950">
                      {act.descripcion}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      {formatDateTimeES(act.fecha)} {act.entidadId ? `· ${act.entidadId}` : ''}
                    </div>
                  </div>
                </div>

                {act.targetView && (
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-900 transition-colors shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
