import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { ProductItem, ViewMode } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { generateNextId } from '../../utils/formatters';

interface ProductFormProps {
  productId?: string;
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  productId,
  onNavigate,
  onShowToast,
}) => {
  const isEditing = !!productId;
  const db = storageService.getDatabase();
  const company = db.company;

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    categoria: 'Servicios',
    descripcion: '',
    precio: 0,
    iva: company.ivaPorDefecto || 21,
    unidad: 'proyecto' as 'hora' | 'proyecto' | 'mensualidad' | 'unidad',
    activo: true,
  });

  useEffect(() => {
    if (isEditing && productId) {
      const existing = db.products.find((p) => p.id === productId);
      if (existing) {
        setFormData({
          codigo: existing.codigo || existing.referencia || existing.id,
          nombre: existing.nombre,
          categoria: existing.categoria,
          descripcion: existing.descripcion,
          precio: existing.precio,
          iva: existing.iva,
          unidad: (existing.unidad as any) || 'proyecto',
          activo: existing.activo !== false,
        });
      }
    } else {
      const nextCode = generateNextId(
        'SRV',
        db.products.map((p) => p.codigo || p.referencia || p.id),
        false
      );
      setFormData((prev) => ({ ...prev, codigo: nextCode }));
    }
  }, [isEditing, productId, db.products]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'precio' || name === 'iva' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      onShowToast('error', 'Indica el nombre del servicio o producto.');
      return;
    }

    onShowToast('loading', 'Guardando en catálogo...');

    if (isEditing && productId) {
      const existing = storageService.getProduct(productId);
      if (existing) {
        storageService.saveProduct({
          ...existing,
          ...formData,
        });
      }
    } else {
      const newProduct: ProductItem = {
        id: formData.codigo || `PRD-${Date.now().toString().slice(-4)}`,
        ...formData,
      };
      storageService.saveProduct(newProduct);
    }

    onShowToast('success', 'Concepto guardado en catálogo.');
    onNavigate('products');
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-100">
      <div className="flex items-center justify-between">
        <BackButton label="Volver al catálogo" onClick={() => onNavigate('products')} />
        <div className="text-xs font-mono text-neutral-400">
          {isEditing ? `Editando: ${productId}` : 'Nuevo artículo de catálogo'}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">
            {isEditing ? 'Editar Servicio / Producto' : 'Nuevo Servicio / Producto'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Define los atributos y precios estándar para incorporarlos a facturación.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Código / Referencia *
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Categoría
              </label>
              <input
                type="text"
                name="categoria"
                value={formData.categoria ?? ''}
                onChange={handleChange}
                placeholder="Ej: Desarrollo / Consultoría / Infraestructura"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Nombre del Concepto *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre ?? ''}
                onChange={handleChange}
                placeholder="Ej: Auditoría de Seguridad y Cumplimiento Normativo"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Precio Base (€) *
              </label>
              <input
                type="number"
                step="0.01"
                name="precio"
                value={formData.precio ?? 0}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                IVA Repercutido (%)
              </label>
              <input
                type="number"
                name="iva"
                value={formData.iva ?? 21}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Unidad de Tarificación
              </label>
              <select
                name="unidad"
                value={formData.unidad ?? 'proyecto'}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm cursor-pointer"
              >
                <option value="hora">hora</option>
                <option value="proyecto">proyecto</option>
                <option value="mensualidad">mensualidad</option>
                <option value="unidad">unidad</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Descripción Detallada
              </label>
              <textarea
                name="descripcion"
                rows={3}
                value={formData.descripcion ?? ''}
                onChange={handleChange}
                placeholder="Especificación del alcance estándar que se insertará al añadir este concepto..."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-sm cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer transition-colors shadow-xs"
            >
              Guardar en Catálogo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
