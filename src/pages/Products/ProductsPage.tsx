import React, { useState } from 'react';
import { Plus, Search, Package, Trash2, Edit, Tag } from 'lucide-react';
import { storageService } from '../../services/storage';
import { ProductItem, ViewMode } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface ProductsPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

  const categories = ['Todos', 'Servicios', 'Consultoría', 'Desarrollo', 'Infraestructura', 'Suscripción'];

  const filteredProducts = db.products.filter((p) => {
    if (categoryFilter !== 'Todos' && p.categoria !== categoryFilter) return false;
    const code = p.codigo || p.referencia || p.id;
    const matches =
      code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matches;
  });

  const handleDelete = () => {
    if (deleteProductId) {
      storageService.deleteProduct(deleteProductId);
      setDeleteProductId(null);
      onShowToast('success', 'Elemento eliminado del catálogo.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Catálogo de Productos y Servicios</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Tarifario oficial, paquetes recurrentes y conceptos precargados para presupuestos y facturas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('product-new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo servicio / producto</span>
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
            placeholder="Buscar por código (SRV-...), nombre o descripción..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-neutral-950 text-white font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          message="Sin productos ni servicios en el catálogo."
          description="Crea tarifas estándar para acelerar la confección de ofertas comerciales."
          actionLabel="Nuevo servicio"
          onAction={() => onNavigate('product-new')}
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Concepto / Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Precio Base</th>
                <th className="px-4 py-3 text-right">IVA</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-neutral-900 whitespace-nowrap">
                    {p.codigo || p.referencia || p.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-neutral-950">{p.nombre}</div>
                    <div className="text-[11px] text-neutral-500 line-clamp-1 max-w-md">
                      {p.descripcion}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">
                    <span className="px-2 py-0.5 bg-neutral-100 rounded text-neutral-800 text-[11px]">
                      {p.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-neutral-950">
                    {formatCurrency(p.precio)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-neutral-500">
                    {p.iva}%
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600 uppercase text-[11px]">
                    / {p.unidad || 'ud'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onNavigate('product-edit', p.id)}
                        className="px-2 py-1 text-[11px] font-mono uppercase bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-sm cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteProductId(p.id)}
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
        isOpen={!!deleteProductId}
        title="Eliminar producto"
        message="¿Seguro que deseas eliminar este concepto del catálogo?"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteProductId(null)}
      />
    </div>
  );
};
