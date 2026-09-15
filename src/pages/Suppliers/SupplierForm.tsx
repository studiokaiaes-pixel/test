import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { Supplier, ViewMode } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { generateNextId, getTodayISO } from '../../utils/formatters';

interface SupplierFormProps {
  supplierId?: string;
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({
  supplierId,
  onNavigate,
  onShowToast,
}) => {
  const isEditing = !!supplierId;
  const db = storageService.getDatabase();

  const [formData, setFormData] = useState({
    empresa: '',
    contacto: '',
    cif: '',
    email: '',
    telefono: '',
    servicio: '',
    direccion: '',
    iban: '',
    notas: '',
    estado: 'Activo' as 'Activo' | 'Inactivo',
  });

  useEffect(() => {
    if (isEditing && supplierId) {
      const existing = db.suppliers.find((s) => s.id === supplierId);
      if (existing) {
        setFormData({
          empresa: existing.empresa || existing.proveedor || '',
          contacto: existing.contacto || '',
          cif: existing.cif || '',
          email: existing.email || '',
          telefono: existing.telefono || '',
          servicio: existing.servicio || '',
          direccion: existing.direccion || '',
          iban: existing.iban || '',
          notas: existing.notas || '',
          estado: existing.estado || 'Activo',
        });
      }
    }
  }, [isEditing, supplierId, db.suppliers]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empresa.trim()) {
      onShowToast('error', 'El nombre de la empresa proveedora es obligatorio.');
      return;
    }

    onShowToast('loading', 'Guardando proveedor...');
    const today = getTodayISO();

    if (isEditing && supplierId) {
      const existing = storageService.getSupplier(supplierId);
      if (existing) {
        storageService.saveSupplier({
          ...existing,
          ...formData,
          proveedor: formData.empresa,
        });
      }
    } else {
      const newId = generateNextId('PRV', db.suppliers.map((s) => s.id), false);
      const newSupplier: Supplier = {
        id: newId,
        ...formData,
        proveedor: formData.empresa,
        fechaAlta: today,
      };
      storageService.saveSupplier(newSupplier);
    }

    onShowToast('success', 'Proveedor guardado correctamente.');
    onNavigate('suppliers');
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-100">
      <div className="flex items-center justify-between">
        <BackButton label="Volver a proveedores" onClick={() => onNavigate('suppliers')} />
        <div className="text-xs font-mono text-neutral-400">
          {isEditing ? `Editando: ${supplierId}` : 'Nuevo proveedor'}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">
            {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Ficha de homologación comercial y datos bancarios para emisión de pagos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Empresa Proveedora *
              </label>
              <input
                type="text"
                name="empresa"
                value={formData.empresa ?? ''}
                onChange={handleChange}
                placeholder="Ej: Cloud Hosting Solutions S.L."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                NIF / CIF
              </label>
              <input
                type="text"
                name="cif"
                value={formData.cif ?? ''}
                onChange={handleChange}
                placeholder="B-99887766"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                name="contacto"
                value={formData.contacto ?? ''}
                onChange={handleChange}
                placeholder="Ej: Marta Soler"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Servicio / Suministro Suministrado
              </label>
              <input
                type="text"
                name="servicio"
                value={formData.servicio ?? ''}
                onChange={handleChange}
                placeholder="Ej: Servidores y Cloud / Asesoría Jurídica"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email ?? ''}
                onChange={handleChange}
                placeholder="facturacion@proveedor.com"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono ?? ''}
                onChange={handleChange}
                placeholder="+34 910 000 000"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                IBAN / Cuenta para Pagos
              </label>
              <input
                type="text"
                name="iban"
                value={formData.iban ?? ''}
                onChange={handleChange}
                placeholder="ES00 0000 0000 0000 0000 0000"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Estado
              </label>
              <select
                name="estado"
                value={formData.estado ?? 'Activo'}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Notas y Acuerdos de Nivel de Servicio (SLA)
              </label>
              <textarea
                name="notas"
                rows={2}
                value={formData.notas ?? ''}
                onChange={handleChange}
                placeholder="Condiciones de pago acordadas a 30 o 60 días..."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('suppliers')}
              className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-sm cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer transition-colors shadow-xs"
            >
              Guardar Proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
