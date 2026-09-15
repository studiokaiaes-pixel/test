import React, { useState } from 'react';
import { Plus, Search, FileText, Eye, Trash2 } from 'lucide-react';
import { storageService } from '../../services/storage';
import { ViewMode, QuoteStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateES, formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface QuotesListProps {
  onNavigate: (view: ViewMode, id?: string) => void;
}

export const QuotesList: React.FC<QuotesListProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);

  const db = storageService.getDatabase();
  const quotes = db.quotes;

  const statuses = ['Todos', 'Borrador', 'Enviado', 'Aceptado', 'Rechazado', 'Cancelado'];

  const filteredQuotes = quotes.filter((q) => {
    const client = db.clients.find((c) => c.id === q.clienteId);
    const clientName = client ? `${client.empresa} ${client.nombre} ${client.apellidos}` : '';

    const matchesSearch =
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.total.toString().includes(searchTerm);

    if (!matchesSearch) return false;
    if (statusFilter !== 'Todos' && q.estado !== statusFilter) return false;
    return true;
  });

  const handleDelete = () => {
    if (deleteQuoteId) {
      storageService.deleteQuote(deleteQuoteId);
      setDeleteQuoteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Presupuestos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Emisión, control y seguimiento de ofertas y propuestas comerciales.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('quote-builder')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo presupuesto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 border border-neutral-200 rounded-sm shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número (PRE-2026-...), cliente o importe..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-900 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-neutral-950 text-white font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Empty State */}
      {filteredQuotes.length === 0 ? (
        <EmptyState
          message="Sin presupuestos todavía."
          description={
            searchTerm
              ? 'No hay presupuestos que coincidan con la búsqueda actual.'
              : 'Utiliza el constructor para emitir el primer presupuesto profesional de KAIA.'
          }
          actionLabel="Nuevo presupuesto"
          onAction={() => onNavigate('quote-builder')}
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Validez</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
                <th className="px-4 py-3 text-right">IVA</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredQuotes.map((q) => {
                const client = db.clients.find((c) => c.id === q.clienteId);

                return (
                  <tr
                    key={q.id}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                    onClick={() => onNavigate('quote-detail', q.id)}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                      {q.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {client?.empresa || (client ? `${client.nombre} ${client.apellidos}` : q.clienteId)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
                      {formatDateES(q.fecha)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
                      {formatDateES(q.validez)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.estado} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-600">
                      {formatCurrency(q.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-600">
                      {formatCurrency(q.ivaTotal)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-950">
                      {formatCurrency(q.total)}
                    </td>
                    <td
                      className="px-4 py-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNavigate('quote-detail', q.id)}
                          className="p-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-sm cursor-pointer"
                          title="Ver documento"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteQuoteId(q.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-sm cursor-pointer"
                          title="Eliminar presupuesto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteQuoteId}
        title="Eliminar presupuesto"
        message="¿Seguro que quieres eliminar este presupuesto? Esta acción borrará el documento de la base de datos de KAIA."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteQuoteId(null)}
      />
    </div>
  );
};
