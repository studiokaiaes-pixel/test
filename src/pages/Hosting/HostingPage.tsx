import React, { useState } from 'react';
import { Server, Plus, Search, Trash2, Edit, ExternalLink, AlertTriangle } from 'lucide-react';
import { HostingItem, ViewMode } from '../../types';
import { storageService } from '../../services/storage';

interface HostingPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const HostingPage: React.FC<HostingPageProps> = ({ onNavigate, onShowToast }) => {
  const [hostingList, setHostingList] = useState<HostingItem[]>(storageService.getHosting());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHosting, setEditingHosting] = useState<Partial<HostingItem>>({});

  const clients = storageService.getClients();

  const handleOpenModal = (hosting?: HostingItem) => {
    if (hosting) {
      setEditingHosting(hosting);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      setEditingHosting({
        id: `HST-${Date.now().toString().slice(-4)}`,
        clienteId: clients[0]?.id || '',
        proveedor: 'Hetzner / Cloudways',
        servicio: 'Hosting WordPress Pro',
        plan: 'NVMe VPS 2-Core',
        servidor: 'srv-mad-01.kaia.tech',
        fechaContratacion: today,
        fechaRenovacion: nextYear,
        coste: 120.0,
        estado: 'Activo',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHosting.clienteId || !editingHosting.servidor) {
      onShowToast('error', 'Completa el servidor/host y asigna un cliente.');
      return;
    }

    const itemToSave: HostingItem = {
      id: editingHosting.id || `HST-${Date.now().toString().slice(-4)}`,
      clienteId: editingHosting.clienteId,
      proveedor: editingHosting.proveedor || 'Proveedor General',
      servicio: editingHosting.servicio || 'Alojamiento Web',
      plan: editingHosting.plan || 'Estándar',
      servidor: editingHosting.servidor,
      fechaContratacion: editingHosting.fechaContratacion || new Date().toISOString().split('T')[0],
      fechaRenovacion: editingHosting.fechaRenovacion || new Date().toISOString().split('T')[0],
      coste: Number(editingHosting.coste || 0),
      estado: editingHosting.estado || 'Activo',
      notas: editingHosting.notas || '',
    };

    storageService.saveHosting(itemToSave);
    setHostingList(storageService.getHosting());
    setIsModalOpen(false);
    onShowToast('success', 'Plan de hosting guardado correctamente.');
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta configuración de hosting?')) {
      storageService.deleteHosting(id);
      setHostingList(storageService.getHosting());
      onShowToast('success', 'Hosting eliminado.');
    }
  };

  const filtered = hostingList.filter(
    (h) =>
      h.servidor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.servicio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Server className="w-6 h-6 text-neutral-800" />
            Gestión de Hosting & Servidores
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Control de alojamientos web, VPS, servidores dedicados y planes por cliente.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-3.5 py-2 rounded-sm text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Hosting
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
        <input
          type="text"
          placeholder="Buscar por servidor, proveedor o servicio..."
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
              <th className="px-4 py-3">Servidor / Plan</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Renovación</th>
              <th className="px-4 py-3">Coste</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  No hay planes de hosting registrados.
                </td>
              </tr>
            ) : (
              filtered.map((h) => {
                const client = clients.find((c) => c.id === h.clienteId);
                const isWarning = h.estado === 'Próximo a renovar' || h.estado === 'Caducado';

                return (
                  <tr key={h.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900 font-mono">{h.servidor}</div>
                      <div className="text-[10px] text-neutral-500">{h.servicio} ({h.plan})</div>
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
                    <td className="px-4 py-3 text-neutral-600">{h.proveedor}</td>
                    <td className="px-4 py-3 font-mono">{h.fechaRenovacion || '—'}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900">
                      {h.coste.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : h.estado === 'Activo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {isWarning && <AlertTriangle className="w-3 h-3" />}
                        {h.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(h)}
                        className="p-1 text-neutral-500 hover:text-neutral-900"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
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
              {editingHosting.id ? 'Editar Hosting' : 'Nuevo Alojamiento'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Nombre Servidor / Host</label>
                <input
                  type="text"
                  required
                  placeholder="srv-mad-01.kaia.tech"
                  value={editingHosting.servidor || ''}
                  onChange={(e) => setEditingHosting({ ...editingHosting, servidor: e.target.value })}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Cliente Asociado</label>
                <select
                  value={editingHosting.clienteId || ''}
                  onChange={(e) => setEditingHosting({ ...editingHosting, clienteId: e.target.value })}
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
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Proveedor / DataCenter</label>
                  <input
                    type="text"
                    value={editingHosting.proveedor || ''}
                    onChange={(e) => setEditingHosting({ ...editingHosting, proveedor: e.target.value })}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Plan / Tipo</label>
                  <input
                    type="text"
                    value={editingHosting.plan || ''}
                    onChange={(e) => setEditingHosting({ ...editingHosting, plan: e.target.value })}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Fecha Renovación</label>
                  <input
                    type="date"
                    value={editingHosting.fechaRenovacion || ''}
                    onChange={(e) => setEditingHosting({ ...editingHosting, fechaRenovacion: e.target.value })}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Coste Anual (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingHosting.coste || 0}
                    onChange={(e) => setEditingHosting({ ...editingHosting, coste: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                  />
                </div>
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
                  Guardar Hosting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
