import React, { useState } from 'react';
import { Plus, Search, Truck, Eye, Trash2, Mail, Phone, ExternalLink } from 'lucide-react';
import { storageService } from '../../services/storage';
import { Supplier, ViewMode } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateES } from '../../utils/formatters';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface SuppliersPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteSupplierId, setDeleteSupplierId] = useState<string | null>(null);

  const filteredSuppliers = db.suppliers.filter((s) => {
    const empresaName = s.empresa || s.proveedor || '';
    const matches =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.servicio.toLowerCase().includes(searchTerm.toLowerCase());
    return matches;
  });

  const handleDelete = () => {
    if (deleteSupplierId) {
      storageService.deleteSupplier(deleteSupplierId);
      setDeleteSupplierId(null);
      onShowToast('success', 'Proveedor eliminado.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Proveedores</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Homologación de suministros, proveedores externos y compras operativas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('supplier-new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo proveedor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 border border-neutral-200 rounded-sm shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por empresa, contacto, servicio o CIF..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-900 transition-colors"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      {filteredSuppliers.length === 0 ? (
        <EmptyState
          message="Sin proveedores registrados."
          description="Añade tus partners tecnológicos, suministradores o colaboradores habituales."
          actionLabel="Nuevo proveedor"
          onAction={() => onNavigate('supplier-new')}
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Empresa Proveedora</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Servicio / Categoría</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                    {s.id}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-950">
                    {s.empresa || s.proveedor}
                    {s.cif && <span className="block text-[10px] text-neutral-400 font-mono font-normal">CIF: {s.cif}</span>}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {s.contacto || '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    <span className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-800 text-[11px]">
                      {s.servicio}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600 text-[11px]">
                    {s.email || '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600 text-[11px]">
                    {s.telefono || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.estado} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onNavigate('supplier-edit', s.id)}
                        className="px-2 py-1 text-[11px] font-mono uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-sm cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSupplierId(s.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-sm cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteSupplierId}
        title="Eliminar proveedor"
        message="¿Seguro que quieres eliminar este proveedor de la base de datos?"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteSupplierId(null)}
      />
    </div>
  );
};
