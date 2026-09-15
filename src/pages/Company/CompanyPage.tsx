import React, { useState } from 'react';
import { Building2, Save, Upload, Check } from 'lucide-react';
import { storageService } from '../../services/storage';
import { CompanyInfo, ViewMode } from '../../types';

interface CompanyPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const CompanyPage: React.FC<CompanyPageProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const company = storageService.getCompany();
  const [formData, setFormData] = useState<CompanyInfo>({
    nombreComercial: company.nombreComercial || '',
    razonSocial: company.razonSocial || '',
    cif: company.cif || '',
    direccion: company.direccion || '',
    codigoPostal: company.codigoPostal || '',
    ciudad: company.ciudad || '',
    provincia: company.provincia || '',
    pais: company.pais || '',
    telefono: company.telefono || '',
    email: company.email || '',
    web: company.web || '',
    iban: company.iban || '',
    banco: company.banco || '',
    swift: company.swift || '',
    condicionesPago: company.condicionesPago || '',
    ivaPorDefecto: company.ivaPorDefecto ?? 21,
    retencionIRPF: company.retencionIRPF ?? 0,
    cuentaBancaria: company.cuentaBancaria || '',
    registroMercantil: company.registroMercantil || '',
    condicionesDefecto: company.condicionesDefecto || '',
    pieFacturaDefecto: company.pieFacturaDefecto || '',
    moneda: company.moneda || 'EUR',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'ivaPorDefecto' || name === 'retencionIRPF'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('loading', 'Actualizando datos corporativos...');
    storageService.saveCompany(formData);
    onShowToast('success', 'Datos de la empresa guardados correctamente.');
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-100">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Datos de la Empresa</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Información fiscal y legal que se estampa automáticamente en presupuestos y facturas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar datos de la empresa</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-sm shadow-xs p-6 space-y-8">
        {/* Identidad de Marca y Fiscal */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
            1. IDENTIFICACIÓN FISCAL Y COMERCIAL
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Nombre Comercial
              </label>
              <input
                type="text"
                name="nombreComercial"
                value={formData.nombreComercial ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-bold text-neutral-950"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Razón Social Oficial
              </label>
              <input
                type="text"
                name="razonSocial"
                value={formData.razonSocial ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
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
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Moneda Predeterminada
              </label>
              <input
                type="text"
                name="moneda"
                value={formData.moneda ?? 'EUR'}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Domicilio Fiscal */}
        <div className="space-y-4 pt-6 border-t border-neutral-200">
          <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
            2. DOMICILIO FISCAL Y LOCALIZACIÓN
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
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
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
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
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
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
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                País
              </label>
              <input
                type="text"
                name="pais"
                value={formData.pais ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>
          </div>
        </div>

        {/* Canales de Contacto */}
        <div className="space-y-4 pt-6 border-t border-neutral-200">
          <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
            3. CONTACTO Y MEDIOS DIGITALES
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Teléfono Corporativo
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Email General / Facturación
              </label>
              <input
                type="email"
                name="email"
                value={formData.email ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Página Web
              </label>
              <input
                type="text"
                name="web"
                value={formData.web ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Datos Bancarios */}
        <div className="space-y-4 pt-6 border-t border-neutral-200">
          <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
            4. DATOS BANCARIOS PARA COBROS Y TRANSFERENCIAS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Entidad Bancaria
              </label>
              <input
                type="text"
                name="banco"
                value={formData.banco ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                IBAN
              </label>
              <input
                type="text"
                name="iban"
                value={formData.iban ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Código BIC / SWIFT
              </label>
              <input
                type="text"
                name="swift"
                value={formData.swift ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Parámetros de Impuestos y Textos Legales */}
        <div className="space-y-4 pt-6 border-t border-neutral-200">
          <h2 className="text-xs font-mono font-bold tracking-widest text-neutral-400 uppercase">
            5. IMPUESTOS Y CLÁUSULAS PREDETERMINADAS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                IVA Predeterminado (%)
              </label>
              <input
                type="number"
                name="ivaPorDefecto"
                value={formData.ivaPorDefecto ?? 21}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Retención IRPF Predeterminada (%)
              </label>
              <input
                type="number"
                name="retencionIRPF"
                value={formData.retencionIRPF ?? 0}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Condiciones Generales Predeterminadas en Presupuestos
              </label>
              <textarea
                name="condicionesDefecto"
                rows={2}
                value={formData.condicionesDefecto ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Texto Legal al Pie de Facturas
              </label>
              <textarea
                name="pieFacturaDefecto"
                rows={2}
                value={formData.pieFacturaDefecto ?? ''}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors"
          >
            Guardar datos de la empresa
          </button>
        </div>
      </form>
    </div>
  );
};
