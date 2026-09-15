import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { Project, ProjectStatus, ViewMode } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { generateNextId, getTodayISO, addDaysISO } from '../../utils/formatters';

interface ProjectFormProps {
  projectId?: string;
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  projectId,
  onNavigate,
  onShowToast,
}) => {
  const isEditing = !!projectId;
  const db = storageService.getDatabase();

  const [formData, setFormData] = useState({
    titulo: '',
    clienteId: '',
    servicio: '',
    descripcion: '',
    estado: 'En preparación' as ProjectStatus,
    fechaInicio: getTodayISO(),
    fechaPrevista: addDaysISO(60),
    importe: 0,
    responsable: '',
    presupuestoId: '',
    notas: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && projectId) {
      const existing = db.projects.find((p) => p.id === projectId);
      if (existing) {
        setFormData({
          titulo: existing.titulo || '',
          clienteId: existing.clienteId || '',
          servicio: existing.servicio || '',
          descripcion: existing.descripcion || '',
          estado: existing.estado || 'En preparación',
          fechaInicio: existing.fechaInicio || '',
          fechaPrevista: existing.fechaPrevista || '',
          importe: existing.importe ?? 0,
          responsable: existing.responsable || '',
          presupuestoId: existing.presupuestoId || '',
          notas: existing.notas || '',
        });
      }
    } else if (db.clients.length > 0 && !formData.clienteId) {
      setFormData((prev) => ({ ...prev, clienteId: db.clients[0].id }));
    }
  }, [isEditing, projectId, db.projects, db.clients]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'importe' ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.titulo.trim()) newErrors.titulo = 'El título del proyecto es obligatorio.';
    if (!formData.clienteId) newErrors.clienteId = 'Debes seleccionar un cliente.';
    if (!formData.servicio.trim()) newErrors.servicio = 'Especifica el servicio principal.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      onShowToast('error', 'Revisa los campos requeridos del formulario.');
      return;
    }

    onShowToast('loading', 'Guardando proyecto en KAIA...');
    const today = getTodayISO();
    let finalId = projectId;

    if (isEditing && projectId) {
      const existing = storageService.getProject(projectId);
      if (existing) {
        const updated: Project = {
          ...existing,
          ...formData,
          fechaModificacion: today,
        };
        storageService.saveProject(updated);
      }
    } else {
      const existingIds = db.projects.map((p) => p.id);
      finalId = generateNextId('PRO', existingIds, false);
      const newProj: Project = {
        id: finalId,
        ...formData,
        tareas: [],
        fechaCreacion: today,
        fechaModificacion: today,
      };
      storageService.saveProject(newProj);
    }

    onShowToast('success', 'Proyecto guardado correctamente.');
    onNavigate('project-detail', finalId);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-100">
      <div className="flex items-center justify-between">
        <BackButton
          label={isEditing ? 'Volver al detalle' : 'Volver a proyectos'}
          onClick={() =>
            isEditing && projectId
              ? onNavigate('project-detail', projectId)
              : onNavigate('projects')
          }
        />
        <div className="text-xs font-mono text-neutral-400">
          {isEditing ? `Editando: ${projectId}` : 'Alta de nuevo proyecto'}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">
            {isEditing ? 'Editar proyecto' : 'Nuevo proyecto'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Parámetros operativos y económicos del proyecto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Título del Proyecto *
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo ?? ''}
                onChange={handleChange}
                placeholder="Ej: Desarrollo de Plataforma de Comercio B2B"
                className={`w-full text-xs px-3 py-2 bg-neutral-50 border rounded-sm focus:bg-white focus:outline-hidden ${
                  errors.titulo
                    ? 'border-neutral-950 ring-1 ring-neutral-950'
                    : 'border-neutral-300 focus:border-neutral-950'
                }`}
              />
              {errors.titulo && <p className="text-[11px] text-neutral-800 mt-1">{errors.titulo}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-800">
                  Cliente Vinculado *
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('client-new')}
                  className="text-[10px] font-mono uppercase text-neutral-900 font-bold hover:underline cursor-pointer"
                >
                  + Crear nuevo cliente
                </button>
              </div>
              <select
                name="clienteId"
                value={formData.clienteId ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 cursor-pointer"
              >
                {db.clients.length === 0 && <option value="">No hay clientes dados de alta</option>}
                {db.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.empresa || `${c.nombre} ${c.apellidos}`} ({c.id})
                  </option>
                ))}
              </select>
              {errors.clienteId && <p className="text-[11px] text-neutral-800 mt-1">{errors.clienteId}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Servicio / Especialidad *
              </label>
              <input
                type="text"
                name="servicio"
                value={formData.servicio ?? ''}
                onChange={handleChange}
                placeholder="Ej: Consultoría Tecnológica / Auditoría"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
              {errors.servicio && <p className="text-[11px] text-neutral-800 mt-1">{errors.servicio}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Estado del Proyecto
              </label>
              <select
                name="estado"
                value={formData.estado ?? 'En preparación'}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 cursor-pointer"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En preparación">En preparación</option>
                <option value="En curso">En curso</option>
                <option value="En revisión">En revisión</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Responsable del Proyecto
              </label>
              <input
                type="text"
                name="responsable"
                value={formData.responsable ?? ''}
                onChange={handleChange}
                placeholder="Nombre del gestor o responsable técnico"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Fecha Prevista de Cierre
              </label>
              <input
                type="date"
                name="fechaPrevista"
                value={formData.fechaPrevista ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Importe Total (€)
              </label>
              <input
                type="number"
                step="0.01"
                name="importe"
                value={formData.importe ?? 0}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Presupuesto Vinculado (Opcional)
              </label>
              <select
                name="presupuestoId"
                value={formData.presupuestoId ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 cursor-pointer"
              >
                <option value="">Sin vincular a presupuesto</option>
                {db.quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.id} — Total: {q.total.toFixed(2)} €
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Descripción y Alcance del Proyecto
              </label>
              <textarea
                name="descripcion"
                rows={3}
                value={formData.descripcion ?? ''}
                onChange={handleChange}
                placeholder="Detalla los objetivos, especificaciones y alcance acordado..."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Notas Internas
              </label>
              <textarea
                name="notas"
                rows={2}
                value={formData.notas ?? ''}
                onChange={handleChange}
                placeholder="Anotaciones de gestión interna..."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                isEditing && projectId
                  ? onNavigate('project-detail', projectId)
                  : onNavigate('projects')
              }
              className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-sm cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer transition-colors shadow-xs"
            >
              Guardar proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
