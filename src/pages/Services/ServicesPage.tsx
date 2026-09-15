import React, { useState } from 'react';
import { Briefcase, Plus, Search, Trash2, Edit, ExternalLink } from 'lucide-react';
import { KaiaServiceItem, ViewMode } from '../../types';
import { storageService } from '../../services/storage';

interface ServicesPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate, onShowToast }) => {
  const [services, setServices] = useState<KaiaServiceItem[]>(storageService.getServices());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<KaiaServiceItem>>({});

  const clients = storageService.getClients();

  const handleOpenModal = (service?: KaiaServiceItem) => {
    if (service) {
      setEditingService(service);
    } else {
      setEditingService({
        id: `SRV-${Date.now().toString().slice(-4)}`,
        nombre: '',
        categoria: 'Diseño Web',
        descripcion: '',
        precio: 0,
        clienteId: clients[0]?.id || '',
        estado: 'Activo',
        fechaContratacion: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService.nombre || !editingService.clienteId) {
      onShowToast('error', 'Por favor completa el nombre y asigna un cliente.');
      return;
    }

    const itemToSave: KaiaServiceItem = {
      id: editingService.id || `SRV-${Date.now().toString().slice(-4)}`,
      nombre: editingService.nombre,
      categoria: editingService.categoria || 'General',
      descripcion: editingService.descripcion || '',
      precio: Number(editingService.precio || 0),
      clienteId: editingService.clienteId,
      estado: editingService.estado || 'Activo',
      fechaContratacion: editingService.fechaContratacion || new Date().toISOString().split('T')[0],
      fechaRenovacion: editingService.fechaRenovacion || '',
      notas: editingService.notas || '',
    };

    storageService.saveService(itemToSave);
    setServices(storageService.getServices());
    setIsModalOpen(false);
    onShowToast('success', 'Servicio guardado correctamente.');
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este servicio del sistema?')) {
      storageService.deleteService(id);
      setServices(storageService.getServices());
      onShowToast('success', 'Servicio eliminado.');
    }
  };

  const filtered = services.filter(
    (s) =>
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-neutral-800" />
            Servicios Contratados
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Gestión de servicios activos, recurrentes y mantenimiento para clientes.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-3.5 py-2 rounded-sm text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Servicio
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
        <input
          type="text"
          placeholder="Buscar servicios por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-sm text-xs bg-white focus:outline-hidden focus:border-neutral-900"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[11px] font-mono text-neutral-500 uppercase">
              <th className="px-4 py-3">ID / Servicio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                  No hay servicios registrados.
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const client = clients.find((c) => c.id === s.clienteId);
                return (
                  <tr key={s.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900">{s.nombre}</div>
                      <div className="text-[10px] font-mono text-neutral-400">{s.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      {client ? (
                        <button
                          onClick={() => onNavigate('client-detail', client.id)}
                          className="font-medium text-neutral-900 hover:underline inline-flex items-center gap-1"
                        >
                          {client.empresa || `${client.nombre} ${client.apellidos}`}
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{s.categoria}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900">
                      {s.precio.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-100 text-emerald-800">
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(s)}
                        className="p-1 text-neutral-500 hover:text-neutral-900"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 text-neutral-500 hover:text-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-sm max-w-lg w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900">
              {editingService.id ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  value={editingService.nombre || ''}
                  onChange={(e) => setEditingService({ ...editingService, nombre: e.target.value })}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Cliente Asociado</label>
                <select
                  value={editingService.clienteId || ''}
                  onChange={(e) => setEditingService({ ...editingService, clienteId: e.target.value })}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                >
                  <option value="">Selecciona un cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.empresa ? `${c.empresa} (${c.nombre})` : `${c.nombre} ${c.apellidos}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={editingService.categoria || ''}
                    onChange={(e) => setEditingService({ ...editingService, categoria: e.target.value })}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Precio (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingService.precio || 0}
                    onChange={(e) => setEditingService({ ...editingService, precio: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={editingService.descripcion || ''}
                  onChange={(e) => setEditingService({ ...editingService, descripcion: e.target.value })}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-neutral-200 text-neutral-700 rounded-sm text-xs font-medium hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 text-white rounded-sm text-xs font-semibold hover:bg-neutral-800"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
