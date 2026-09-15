import React, { useState } from 'react';
import { Plus, Search, FolderKanban, Eye, Trash2 } from 'lucide-react';
import { storageService } from '../../services/storage';
import { ViewMode, ProjectStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateES, formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface ProjectsListProps {
  onNavigate: (view: ViewMode, id?: string) => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const db = storageService.getDatabase();
  const projects = db.projects;

  const statuses = [
    'Todos',
    'Pendiente',
    'En preparación',
    'En curso',
    'En revisión',
    'Finalizado',
    'Cancelado',
  ];

  const filteredProjects = projects.filter((p) => {
    const client = db.clients.find((c) => c.id === p.clienteId);
    const clientName = client ? `${client.empresa} ${client.nombre} ${client.apellidos}` : '';

    const matchesSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'Todos' && p.estado !== statusFilter) return false;
    return true;
  });

  const handleDelete = () => {
    if (deleteProjectId) {
      storageService.deleteProject(deleteProjectId);
      setDeleteProjectId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Proyectos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Supervisión, ejecución técnica y control económico de proyectos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('project-new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo proyecto</span>
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
            placeholder="Buscar por proyecto, cliente, servicio o responsable..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-900 transition-colors"
          />
        </div>

        {/* Status Pills */}
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
      {filteredProjects.length === 0 ? (
        <EmptyState
          message="Sin proyectos todavía."
          description={
            searchTerm
              ? 'No hay proyectos que coincidan con la búsqueda actual.'
              : 'Empieza dando de alta el primer proyecto de la organización.'
          }
          actionLabel="Nuevo proyecto"
          onAction={() => onNavigate('project-new')}
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Servicio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha Inicio</th>
                <th className="px-4 py-3">Fecha Prevista</th>
                <th className="px-4 py-3 text-right">Importe</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredProjects.map((p) => {
                const client = db.clients.find((c) => c.id === p.clienteId);

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                    onClick={() => onNavigate('project-detail', p.id)}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-950">
                      <div className="font-semibold text-neutral-900">{p.titulo}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{p.id}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {client?.empresa || (client ? `${client.nombre} ${client.apellidos}` : '—')}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 max-w-[200px] truncate">
                      {p.servicio || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.estado} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
                      {formatDateES(p.fechaInicio)}
                    </td>
                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
                      {formatDateES(p.fechaPrevista)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900">
                      {formatCurrency(p.importe)}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 font-medium">
                      {p.responsable || '—'}
                    </td>
                    <td
                      className="px-4 py-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNavigate('project-detail', p.id)}
                          className="p-1 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 rounded-sm cursor-pointer"
                          title="Ver detalle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteProjectId(p.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-sm cursor-pointer"
                          title="Eliminar proyecto"
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
        isOpen={!!deleteProjectId}
        title="Eliminar proyecto"
        message="¿Seguro que quieres eliminar este proyecto? Se perderán las tareas y vinculaciones asociadas."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteProjectId(null)}
      />
    </div>
  );
};
