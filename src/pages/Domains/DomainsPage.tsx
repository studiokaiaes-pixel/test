import React, { useState } from 'react';
import { Globe, Plus, Search, Trash2, Edit, ExternalLink, AlertTriangle } from 'lucide-react';
import { DomainItem, ViewMode } from '../../types';
import { storageService } from '../../services/storage';

interface DomainsPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const DomainsPage: React.FC<DomainsPageProps> = ({ onNavigate, onShowToast }) => {
  const [domains, setDomains] = useState<DomainItem[]>(storageService.getDomains());
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Partial<DomainItem>>({});

  const clients = storageService.getClients();

  const handleOpenModal = (domain?: DomainItem) => {
    if (domain) {
      setEditingDomain(domain);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      setEditingDomain({
        id: `DOM-${Date.now().toString().slice(-4)}`,
        dominio: '',
        clienteId: clients[0]?.id || '',
        proveedor: 'Namecheap / DonDominio',
        fechaAlta: today,
        fechaRenovacion: nextYear,
        estado: 'Activo',
        coste: 15.0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomain.dominio || !editingDomain.clienteId) {
      onShowToast('error', 'Completa el nombre del dominio y asigna un cliente.');
      return;
    }

    const itemToSave: DomainItem = {
      id: editingDomain.id || `DOM-${Date.now().toString().slice(-4)}`,
      dominio: editingDomain.dominio,
      clienteId: editingDomain.clienteId,
      proveedor: editingDomain.proveedor || 'Proveedor General',
      fechaAlta: editingDomain.fechaAlta || new Date().toISOString().split('T')[0],
      fechaRenovacion: editingDomain.fechaRenovacion || new Date().toISOString().split('T')[0],
      estado: editingDomain.estado || 'Activo',
      coste: Number(editingDomain.coste || 0),
      notas: editingDomain.notas || '',
    };

    storageService.saveDomain(itemToSave);
    setDomains(storageService.getDomains());
    setIsModalOpen(false);
    onShowToast('success', 'Dominio guardado correctamente.');
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este dominio?')) {
      storageService.deleteDomain(id);
      setDomains(storageService.getDomains());
      onShowToast('success', 'Dominio eliminado.');
    }
  };

  const filtered = domains.filter(
    (d) =>
      d.dominio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-neutral-800" />
            Gestión de Dominios
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Control de renovaciones, registradores y costes de dominios por cliente.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-3.5 py-2 rounded-sm text-xs font-semibold hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Dominio
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
        <input
          type="text"
          placeholder="Buscar dominio o proveedor..."
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
              <th className="px-4 py-3">Dominio</th>
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
                  No hay dominios registrados.
                </td>
              </tr>
            ) : (
              filtered.map((d) => {
                const client = clients.find((c) => c.id === d.clienteId);
                const isWarning = d.estado === 'Próximo a renovar' || d.estado === 'Caducado';

                return (
                  <tr key={d.id} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900 font-mono">{d.dominio}</div>
                      <div className="text-[10px] font-mono text-neutral-400">{d.id}</div>
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
                    <td className="px-4 py-3 text-neutral-600">{d.proveedor}</td>
                    <td className="px-4 py-3 font-mono">{d.fechaRenovacion || '—'}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900">
                      {d.coste.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : d.estado === 'Activo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {isWarning && <AlertTriangle className="w-3 h-3" />}
                        {d.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(d)}
                        className="p-1 text-neutral-500 hover:text-neutral-900"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
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
              {editingDomain.id ? 'Editar Dominio' : 'Nuevo Dominio'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Nombre de Dominio</label>
                <input
                  type="text"
                  required
                  placeholder="ejemplo.com"
                  value={editingDomain.dominio || ''}
                  onChange={(e) => setEditingDomain({ ...editingDomain, dominio: e.target.value })}
                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs font-mono focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Cliente Asociado</label>
                <select
                  value={editingDomain.clienteId || ''}
                  onChange={(e) => setEditingDomain({ ...editingDomain, clienteId: e.target.value })}
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
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Proveedor / Registrador</label>
                  <input
                    type="text"
                    value={editingDomain.proveedor || ''}
                    onChange={(e) => setEditingDomain({ ...editingDomain, proveedor: e.target.value })}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Estado</label>
                  <select
                    value={editingDomain.estado || 'Activo'}
                    onChange={(e) => setEditingDomain({ ...editingDomain, estado: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs focus:outline-hidden"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Próximo a renovar">Próximo a renovar</option>
                    <option value="Caducado">Caducado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Fecha Renovación</label>
                  <input
                    type="date"
                    value={editingDomain.fechaRenovacion || ''}
                    onChange={(e) => setEditingDomain({ ...editingDomain, fechaRenovacion: e.target.value })}
                    className="w-full px-3 py-1.5 border border-neutral-200 rounded-sm text-xs font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Coste Anual (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingDomain.coste || 0}
                    onChange={(e) => setEditingDomain({ ...editingDomain, coste: parseFloat(e.target.value) })}
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
                  Guardar Dominio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
