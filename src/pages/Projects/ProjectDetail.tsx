import React, { useState } from 'react';
import {
  Edit,
  Trash2,
  CheckSquare,
  Square,
  Plus,
  ArrowRight,
  FileText,
  Receipt,
  File,
  History,
  Clock,
  User,
  ExternalLink,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { ViewMode, ProjectStatus } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { formatDateES, formatCurrency } from '../../utils/formatters';

interface ProjectDetailProps {
  projectId: string;
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  projectId,
  onNavigate,
  onShowToast,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const db = storageService.getDatabase();
  const project = db.projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="space-y-6">
        <BackButton label="Volver a proyectos" onClick={() => onNavigate('projects')} />
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-sm">
          <p className="text-neutral-600">Proyecto no encontrado en la base de datos.</p>
        </div>
      </div>
    );
  }

  const client = db.clients.find((c) => c.id === project.clienteId);
  const associatedQuote = project.presupuestoId
    ? db.quotes.find((q) => q.id === project.presupuestoId)
    : undefined;
  const associatedInvoices = db.invoices.filter(
    (i) => i.proyectoId === project.id || (project.presupuestoId && i.presupuestoId === project.presupuestoId)
  );
  const associatedDocs = db.documents.filter((d) => d.proyectoId === project.id);
  const projectActivities = db.activities.filter(
    (a) => a.entidadId === project.id || (project.presupuestoId && a.entidadId === project.presupuestoId)
  );

  const handleDelete = () => {
    storageService.deleteProject(project.id);
    onNavigate('projects');
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = (project.tareas || []).map((t) =>
      t.id === taskId ? { ...t, completada: !t.completada } : t
    );
    const updated = {
      ...project,
      tareas: updatedTasks,
      fechaModificacion: new Date().toISOString().split('T')[0],
    };
    storageService.saveProject(updated);
    onShowToast('success', 'Tarea actualizada.');
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      texto: newTaskText.trim(),
      completada: false,
    };
    const updatedTasks = [...(project.tareas || []), newTask];
    const updated = {
      ...project,
      tareas: updatedTasks,
      fechaModificacion: new Date().toISOString().split('T')[0],
    };
    storageService.saveProject(updated);
    setNewTaskText('');
    onShowToast('success', 'Nueva tarea añadida.');
  };

  const completedCount = (project.tareas || []).filter((t) => t.completada).length;
  const totalTasks = (project.tareas || []).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Volver a proyectos" onClick={() => onNavigate('projects')} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('project-edit', project.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-800 bg-white border border-neutral-300 hover:border-neutral-900 rounded-sm cursor-pointer transition-colors shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Editar proyecto</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 bg-white border border-neutral-200 hover:border-neutral-900 rounded-sm cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div className="bg-white border border-neutral-200 rounded-sm p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold text-neutral-500">{project.id}</span>
              <StatusBadge status={project.estado} />
              {project.isDemo && (
                <span className="text-[10px] font-mono border border-neutral-300 px-1.5 py-0.5 rounded text-neutral-400">
                  DEMO
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-neutral-950 mt-1.5">{project.titulo}</h1>
            <p className="text-sm text-neutral-600 mt-1">{project.servicio}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block">Importe presupuestado</span>
            <div className="text-2xl font-bold font-mono text-neutral-950">
              {formatCurrency(project.importe)}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Cliente</span>
            {client ? (
              <button
                type="button"
                onClick={() => onNavigate('client-detail', client.id)}
                className="font-semibold text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer text-left"
              >
                <span>{client.empresa || `${client.nombre} ${client.apellidos}`}</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </button>
            ) : (
              <span className="text-neutral-500">Sin cliente vinculado</span>
            )}
          </div>

          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Responsable</span>
            <span className="font-medium text-neutral-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neutral-400" />
              {project.responsable || 'No asignado'}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Fecha de Inicio</span>
            <span className="font-mono text-neutral-900">{formatDateES(project.fechaInicio)}</span>
          </div>

          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Fecha Prevista</span>
            <span className="font-mono text-neutral-900">{formatDateES(project.fechaPrevista)}</span>
          </div>
        </div>

        {/* Description & Internal Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
              DESCRIPCIÓN DEL PROYECTO
            </h3>
            <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
              {project.descripcion || 'Sin descripción detallada.'}
            </p>
          </div>
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 font-bold">
              NOTAS INTERNAS DE SEGUIMIENTO
            </h3>
            <p className="text-neutral-600 italic whitespace-pre-line">
              {project.notas || 'Sin notas internas.'}
            </p>
          </div>
        </div>
      </div>

      {/* Two columns: Tareas (Checklist) & Economic/Documents Relationships */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tareas (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-sm p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-neutral-800" />
              <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-900 uppercase">
                TAREAS Y ENTREGABLES ({completedCount}/{totalTasks})
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold text-neutral-700">
              {progressPercent}% completado
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-neutral-100 h-1.5 rounded-xs overflow-hidden">
            <div
              className="bg-neutral-950 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Task list */}
          <div className="space-y-2 pt-2">
            {(project.tareas || []).map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="flex items-start gap-3 p-2.5 rounded-sm hover:bg-neutral-50 transition-colors cursor-pointer group border border-neutral-100"
              >
                <button
                  type="button"
                  className="text-neutral-700 group-hover:text-neutral-950 mt-0.5"
                >
                  {t.completada ? (
                    <CheckSquare className="w-4 h-4 text-neutral-950" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
                <span
                  className={`text-xs ${
                    t.completada ? 'line-through text-neutral-400' : 'text-neutral-900 font-medium'
                  }`}
                >
                  {t.texto}
                </span>
              </div>
            ))}

            {(!project.tareas || project.tareas.length === 0) && (
              <p className="text-xs text-neutral-400 py-4 text-center">
                No se han registrado tareas todavía para este proyecto.
              </p>
            )}
          </div>

          {/* Add task inline input */}
          <form onSubmit={addTask} className="pt-3 border-t border-neutral-100 flex items-center gap-2">
            <input
              type="text"
              value={newTaskText ?? ''}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Nueva tarea o hito..."
              className="flex-1 text-xs px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
            >
              Añadir
            </button>
          </form>
        </div>

        {/* Sidebar Relations: Presupuesto, Facturas, Documentos */}
        <div className="space-y-6">
          {/* Presupuesto Vinculado */}
          <div className="bg-white border border-neutral-200 rounded-sm p-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 mb-3">
              <FileText className="w-3.5 h-3.5 text-neutral-600" />
              <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-700">
                PRESUPUESTO ASOCIADO
              </h3>
            </div>

            {associatedQuote ? (
              <div
                onClick={() => onNavigate('quote-detail', associatedQuote.id)}
                className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-sm hover:border-neutral-400 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-neutral-900">
                    {associatedQuote.id}
                  </span>
                  <StatusBadge status={associatedQuote.estado} />
                </div>
                <div className="text-[11px] font-mono text-neutral-600 mt-1">
                  Total: {formatCurrency(associatedQuote.total)}
                </div>
              </div>
            ) : (
              <div className="text-xs text-neutral-400 py-2">
                Sin presupuesto formal asociado.{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('quote-builder')}
                  className="text-neutral-900 font-semibold underline cursor-pointer"
                >
                  Generar
                </button>
              </div>
            )}
          </div>

          {/* Facturas Vinculadas */}
          <div className="bg-white border border-neutral-200 rounded-sm p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5 text-neutral-600" />
                <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-700">
                  FACTURAS ({associatedInvoices.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('invoice-builder')}
                className="text-[10px] font-mono uppercase text-neutral-900 font-bold hover:underline cursor-pointer"
              >
                + Facturar
              </button>
            </div>

            {associatedInvoices.length === 0 ? (
              <div className="text-xs text-neutral-400 py-2">No hay facturas para este proyecto.</div>
            ) : (
              <div className="space-y-2">
                {associatedInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => onNavigate('invoice-detail', inv.id)}
                    className="p-2 bg-neutral-50 border border-neutral-200 rounded-sm hover:border-neutral-400 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-neutral-900">{inv.id}</span>
                      <StatusBadge status={inv.estado} />
                    </div>
                    <div className="text-[11px] font-mono text-neutral-700 mt-1">
                      {formatCurrency(inv.total)} · Pendiente: {formatCurrency(inv.importePendiente)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documentos del Proyecto */}
          <div className="bg-white border border-neutral-200 rounded-sm p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <File className="w-3.5 h-3.5 text-neutral-600" />
                <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-700">
                  DOCUMENTOS ({associatedDocs.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('document-new')}
                className="text-[10px] font-mono uppercase text-neutral-900 font-bold hover:underline cursor-pointer"
              >
                + Subir
              </button>
            </div>

            {associatedDocs.length === 0 ? (
              <div className="text-xs text-neutral-400 py-2">Sin documentos adjuntos.</div>
            ) : (
              <div className="space-y-2">
                {associatedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2 bg-neutral-50 border border-neutral-200 rounded-sm flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-neutral-900 truncate max-w-[170px]">
                      {doc.nombre}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">{doc.tamano}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar proyecto"
        message={`¿Seguro que deseas eliminar el proyecto "${project.titulo}"? Esta acción borrará el registro de la base de datos de KAIA.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
