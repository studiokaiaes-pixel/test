import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { Client, ViewMode } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { generateNextId, getTodayISO } from '../../utils/formatters';

interface ClientFormProps {
  clientId?: string;
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  clientId,
  onNavigate,
  onShowToast,
}) => {
  const isEditing = !!clientId;
  const db = storageService.getDatabase();

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    empresa: '',
    cif: '',
    email: '',
    telefono: '',
    direccion: '',
    codigoPostal: '',
    ciudad: '',
    provincia: '',
    pais: 'España',
    notas: '',
    estado: 'Activo' as 'Activo' | 'Inactivo',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && clientId) {
      const existing = db.clients.find((c) => c.id === clientId);
      if (existing) {
        setFormData({
          nombre: existing.nombre || '',
          apellidos: existing.apellidos || '',
          empresa: existing.empresa || '',
          cif: existing.cif || '',
          email: existing.email || '',
          telefono: existing.telefono || '',
          direccion: existing.direccion || '',
          codigoPostal: existing.codigoPostal || '',
          ciudad: existing.ciudad || '',
          provincia: existing.provincia || '',
          pais: existing.pais || 'España',
          notas: existing.notas || '',
          estado: existing.estado || 'Activo',
        });
      }
    }
  }, [isEditing, clientId, db.clients]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim() && !formData.empresa.trim()) {
      newErrors.nombre = 'Indica al menos el nombre del contacto o la empresa.';
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Introduce una dirección de email válida.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      onShowToast('error', 'Por favor, revisa los campos obligatorios.');
      return;
    }

    onShowToast('loading', 'Guardando cliente en la base de datos...');

    const today = getTodayISO();
    let finalId = clientId;

    if (isEditing && clientId) {
      const existing = storageService.getClient(clientId);
      if (existing) {
        const updated: Client = {
          ...existing,
          ...formData,
          fechaModificacion: today,
        };
        storageService.saveClient(updated);
      }
    } else {
      const existingIds = db.clients.map((c) => c.id);
      finalId = generateNextId('CLI', existingIds, false);
      const newClient: Client = {
        id: finalId,
        ...formData,
        fechaAlta: today,
        fechaModificacion: today,
      };
      storageService.saveClient(newClient);
    }

    onShowToast('success', 'Cliente guardado correctamente.');
    onNavigate('client-detail', finalId);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-100">
      <div className="flex items-center justify-between">
        <BackButton
          label={isEditing ? 'Volver al detalle' : 'Volver a clientes'}
          onClick={() => (isEditing && clientId ? onNavigate('client-detail', clientId) : onNavigate('clients'))}
        />
        <div className="text-xs font-mono text-neutral-400">
          {isEditing ? `Editando: ${clientId}` : 'Nuevo registro de cliente'}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">
            {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Completa la ficha empresarial del cliente. Todos los datos se almacenan de manera persistente en KAIA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Identificación Principal */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
              1. DATOS IDENTIFICATIVOS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Empresa / Razón Comercial
                </label>
                <input
                  type="text"
                  name="empresa"
                  value={formData.empresa ?? ''}
                  onChange={handleChange}
                  placeholder="Ej: Nexus Retail Technologies S.L."
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
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
                  placeholder="Ej: B-12345678"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Nombre del Contacto *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre ?? ''}
                  onChange={handleChange}
                  placeholder="Ej: Alejandro"
                  className={`w-full text-xs px-3 py-2 bg-neutral-50 border rounded-sm focus:bg-white focus:outline-hidden ${
                    errors.nombre ? 'border-neutral-950 ring-1 ring-neutral-950' : 'border-neutral-300 focus:border-neutral-950'
                  }`}
                />
                {errors.nombre && <p className="text-[11px] text-neutral-800 mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Apellidos del Contacto
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos ?? ''}
                  onChange={handleChange}
                  placeholder="Ej: Vidal Navarro"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>
            </div>
          </div>

          {/* Contacto & Localización */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
              2. CONTACTO Y LOCALIZACIÓN
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email ?? ''}
                  onChange={handleChange}
                  placeholder="contacto@empresa.com"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
                />
                {errors.email && <p className="text-[11px] text-neutral-800 mt-1">{errors.email}</p>}
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
                  placeholder="+34 600 000 000"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion ?? ''}
                  onChange={handleChange}
                  placeholder="Calle, número, piso o polígono industrial"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="codigoPostal"
                  value={formData.codigoPostal ?? ''}
                  onChange={handleChange}
                  placeholder="28001"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad ?? ''}
                  onChange={handleChange}
                  placeholder="Madrid"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  name="provincia"
                  value={formData.provincia ?? ''}
                  onChange={handleChange}
                  placeholder="Madrid"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  País
                </label>
                <input
                  type="text"
                  name="pais"
                  value={formData.pais ?? 'España'}
                  onChange={handleChange}
                  placeholder="España"
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>
            </div>
          </div>

          {/* Estado & Notas */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
              3. ESTADO Y OBSERVACIONES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Estado de la cuenta
                </label>
                <select
                  name="estado"
                  value={formData.estado ?? 'Activo'}
                  onChange={handleChange}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 cursor-pointer"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Notas Internas
                </label>
                <textarea
                  name="notas"
                  rows={3}
                  value={formData.notas ?? ''}
                  onChange={handleChange}
                  placeholder="Anotaciones clave sobre acuerdos, interlocutores o particularidades..."
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-6 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => (isEditing && clientId ? onNavigate('client-detail', clientId) : onNavigate('clients'))}
              className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-sm cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer transition-colors shadow-xs"
            >
              Guardar cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
