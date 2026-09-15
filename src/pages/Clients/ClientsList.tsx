import React, { useState } from 'react';
import { Plus, Search, Users, ArrowRight, Eye, Trash2 } from 'lucide-react';
import { storageService } from '../../services/storage';
import { ViewMode } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateES } from '../../utils/formatters';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface ClientsListProps {
  onNavigate: (view: ViewMode, id?: string) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos');
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);

  const db = storageService.getDatabase();
  const clients = db.clients;

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'Activos') return c.estado === 'Activo';
    if (filterStatus === 'Inactivos') return c.estado === 'Inactivo';
    return true;
  });

  const handleDelete = () => {
    if (deleteClientId) {
      storageService.deleteClient(deleteClientId);
      setDeleteClientId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Clientes</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Gestión y relaciones comerciales de clientes corporativos.
          </p>
        </div>

        {/* Action button opens full page form */}
        <button
          type="button"
          onClick={() => onNavigate('client-new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-neutral-200 rounded-sm shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar clientes por nombre, empresa, CIF o email..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-900 transition-colors"
          />
        </div>

        {/* Status Filters: Todos, Activos, Inactivos */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          {(['Todos', 'Activos', 'Inactivos'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setFilterStatus(filter)}
              className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors cursor-pointer ${
                filterStatus === filter
                  ? 'bg-neutral-950 text-white font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Empty State */}
      {filteredClients.length === 0 ? (
        <EmptyState
          message="Sin clientes todavía."
          description={
            searchTerm
              ? 'No hay clientes que coincidan con la búsqueda actual.'
              : 'Comienza creando el primer cliente en la plataforma KAIA.'
          }
          actionLabel="Nuevo cliente"
          onAction={() => onNavigate('client-new')}
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3 text-center">Proyectos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Última actualización</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredClients.map((client) => {
                const clientProjectsCount = db.projects.filter(
                  (p) => p.clienteId === client.id
                ).length;

                return (
                  <tr
                    key={client.id}
                    className="hover:bg-neutral-50 transition-colors group cursor-pointer"
                    onClick={() => onNavigate('client-detail', client.id)}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900 whitespace-nowrap">
                      {client.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-950">
                      {client.nombre} {client.apellidos}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 font-medium">
                      {client.empresa || '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 font-mono text-[11px]">
                      {client.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 font-mono text-[11px]">
                      {client.telefono || '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      <span className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-700">
                        {clientProjectsCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={client.estado} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
                      {formatDateES(client.fechaModificacion || client.fechaAlta)}
                    </td>
                    <td
                      className="px-4 py-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNavigate('client-detail', client.id)}
                          className="p-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-sm cursor-pointer"
                          title="Ver detalle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteClientId(client.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-sm cursor-pointer"
                          title="Eliminar cliente"
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

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={!!deleteClientId}
        title="Eliminar cliente"
        message="¿Seguro que quieres eliminar este cliente? Esta acción borrará el registro de la base de datos de KAIA."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteClientId(null)}
      />
    </div>
  );
};
