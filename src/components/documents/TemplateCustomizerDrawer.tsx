import React, { useState } from 'react';
import {
  X,
  LayoutTemplate,
  Palette,
  Eye,
  FileText,
  Check,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { DocumentTemplateConfig, TemplateModelId } from '../../types';
import {
  COLOR_PRESETS,
  TEMPLATE_MODELS,
  defaultInvoiceTemplateConfig,
  defaultQuoteTemplateConfig,
} from '../../utils/templateDefaults';

interface TemplateCustomizerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'quote' | 'invoice';
  config: DocumentTemplateConfig;
  onChange: (newConfig: DocumentTemplateConfig) => void;
  onSaveDocument: () => void;
  onSaveAsDefault: () => void;
  onReset: () => void;
}

export const TemplateCustomizerDrawer: React.FC<TemplateCustomizerDrawerProps> = ({
  isOpen,
  onClose,
  documentType,
  config,
  onChange,
  onSaveDocument,
  onSaveAsDefault,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'modelos' | 'estilos' | 'visibilidad' | 'textos'>('modelos');

  if (!isOpen) return null;

  const handleUpdate = <K extends keyof DocumentTemplateConfig>(
    key: K,
    value: DocumentTemplateConfig[K]
  ) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const handleToggle = (key: keyof DocumentTemplateConfig) => {
    handleUpdate(key, !config[key]);
  };

  const isQuote = documentType === 'quote';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 print:hidden">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-neutral-900 text-white rounded-xs">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-950">Personalizar Plantilla</h2>
              <p className="text-[11px] text-neutral-500">
                {isQuote ? 'Presupuesto Comercial' : 'Factura Oficial'} · Cambios en vivo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-sm hover:bg-neutral-200 transition-colors cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 border-b border-neutral-200 text-xs font-mono bg-neutral-100/50">
          <button
            type="button"
            onClick={() => setActiveTab('modelos')}
            className={`py-2.5 px-2 text-center border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'modelos'
                ? 'border-neutral-950 text-neutral-950 font-bold bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Modelo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('estilos')}
            className={`py-2.5 px-2 text-center border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'estilos'
                ? 'border-neutral-950 text-neutral-950 font-bold bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Estilo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visibilidad')}
            className={`py-2.5 px-2 text-center border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'visibilidad'
                ? 'border-neutral-950 text-neutral-950 font-bold bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Campos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('textos')}
            className={`py-2.5 px-2 text-center border-b-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'textos'
                ? 'border-neutral-950 text-neutral-950 font-bold bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Textos</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: MODELOS */}
          {activeTab === 'modelos' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  SELECCIONA EL MODELO DE DISEÑO
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  El diseño cambia al instante en la vista previa y en la exportación PDF.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {TEMPLATE_MODELS.map((mod) => {
                  const isSelected = config.modelo === mod.id;
                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleUpdate('modelo', mod.id)}
                      className={`p-3.5 border rounded-sm cursor-pointer transition-all ${
                        isSelected
                          ? 'border-neutral-950 bg-neutral-50/80 shadow-xs ring-1 ring-neutral-950'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-neutral-950">{mod.nombre}</h4>
                            {isSelected && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-950 text-white rounded-xs">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-1">{mod.descripcion}</p>
                          <div className="mt-2 text-[10px] font-mono text-neutral-400">
                            {mod.estiloVisual}
                          </div>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-neutral-950 bg-neutral-950 text-white'
                              : 'border-neutral-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ESTILOS & COLOR */}
          {activeTab === 'estilos' && (
            <div className="space-y-6">
              {/* Accent color */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold mb-2">
                  COLOR DE ACENTO CORPORATIVO
                </h3>
                <p className="text-xs text-neutral-500 mb-3">
                  Se aplica a los encabezados, bandas, totales y líneas clave del documento.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = config.colorAcento.toLowerCase() === preset.valor.toLowerCase();
                    return (
                      <button
                        key={preset.valor}
                        type="button"
                        onClick={() => handleUpdate('colorAcento', preset.valor)}
                        className={`p-2 border rounded-sm text-left flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-neutral-950 bg-neutral-50 ring-1 ring-neutral-950'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: preset.valor }}
                        />
                        <span className="text-[10px] text-neutral-700 font-medium text-center leading-tight">
                          {preset.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-neutral-600">Color libre:</span>
                  <input
                    type="color"
                    value={config.colorAcento}
                    onChange={(e) => handleUpdate('colorAcento', e.target.value)}
                    className="w-8 h-8 rounded-xs cursor-pointer border border-neutral-300 p-0.5"
                  />
                  <span className="text-xs font-mono text-neutral-600 uppercase">
                    {config.colorAcento}
                  </span>
                </div>
              </div>

              {/* Typography */}
              <div className="pt-4 border-t border-neutral-200">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold mb-2">
                  FAMILIA TIPOGRÁFICA
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sans', label: 'Moderna (Sans)', font: 'font-sans' },
                    { id: 'serif', label: 'Elegante (Serif)', font: 'font-serif' },
                    { id: 'mono', label: 'Técnica (Mono)', font: 'font-mono' },
                  ].map((fontItem) => (
                    <button
                      key={fontItem.id}
                      type="button"
                      onClick={() => handleUpdate('fuente', fontItem.id as any)}
                      className={`p-2.5 border rounded-sm text-center cursor-pointer transition-colors ${
                        config.fuente === fontItem.id
                          ? 'border-neutral-950 bg-neutral-50 font-bold ring-1 ring-neutral-950'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <span className={`text-xs block ${fontItem.font}`}>{fontItem.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Document custom title */}
              <div className="pt-4 border-t border-neutral-200 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  ENCABEZADO Y TÍTULOS
                </h3>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Título principal del documento
                  </label>
                  <input
                    type="text"
                    value={config.tituloPersonalizado ?? ''}
                    onChange={(e) => handleUpdate('tituloPersonalizado', e.target.value)}
                    placeholder={isQuote ? 'PRESUPUESTO COMERCIAL' : 'FACTURA ORDINARIA'}
                    className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Subtítulo o descripción breve
                  </label>
                  <input
                    type="text"
                    value={config.subtituloPersonalizado ?? ''}
                    onChange={(e) => handleUpdate('subtituloPersonalizado', e.target.value)}
                    placeholder="Documento oficial y formal..."
                    className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VISIBILIDAD (QUITAR / MOSTRAR INFORMACIÓN) */}
          {activeTab === 'visibilidad' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  QUITAR O MOSTRAR INFORMACIÓN
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Desmarca los campos que desees ocultar para simplificar el documento o destacar lo esencial.
                </p>
              </div>

              {/* Emisor / Empresa */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-200 pb-1">
                  Datos del Emisor (Tu Empresa)
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Logotipo / Nombre Comercial</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarLogo}
                      onChange={() => handleToggle('mostrarLogo')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Razón Social y Datos de Registro</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarDatosEmpresa}
                      onChange={() => handleToggle('mostrarDatosEmpresa')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar CIF / NIF de la Empresa</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarCifEmpresa}
                      onChange={() => handleToggle('mostrarCifEmpresa')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Dirección Postal</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarDireccionEmpresa}
                      onChange={() => handleToggle('mostrarDireccionEmpresa')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Email y Teléfono</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarContactoEmpresa}
                      onChange={() => handleToggle('mostrarContactoEmpresa')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Destinatario / Cliente */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-200 pb-1">
                  Datos del Cliente / Destinatario
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Bloque de Cliente</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarDatosCliente}
                      onChange={() => handleToggle('mostrarDatosCliente')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar CIF / NIF del Cliente</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarCifCliente}
                      onChange={() => handleToggle('mostrarCifCliente')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Dirección del Cliente</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarDireccionCliente}
                      onChange={() => handleToggle('mostrarDireccionCliente')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Contacto (Email / Teléfono)</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarContactoCliente}
                      onChange={() => handleToggle('mostrarContactoCliente')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Fechas y Estados */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-200 pb-1">
                  Fechas y Metadatos
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Fecha de Emisión</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarFechas}
                      onChange={() => handleToggle('mostrarFechas')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>{isQuote ? 'Mostrar Fecha de Validez' : 'Mostrar Fecha de Vencimiento'}</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarValidezVencimiento}
                      onChange={() => handleToggle('mostrarValidezVencimiento')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Etiqueta de Estado</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarEstado}
                      onChange={() => handleToggle('mostrarEstado')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Columnas y Desgloses */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-200 pb-1">
                  Tabla de Partidas y Totales
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Columna de % IVA por Partida</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarColumnaIva}
                      onChange={() => handleToggle('mostrarColumnaIva')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Descuentos</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarColumnaDescuento}
                      onChange={() => handleToggle('mostrarColumnaDescuento')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Desglose de Base e IVA</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarDesgloseImpuestos}
                      onChange={() => handleToggle('mostrarDesgloseImpuestos')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  {!isQuote && (
                    <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                      <span>Mostrar Retención IRPF</span>
                      <input
                        type="checkbox"
                        checked={config.mostrarIrpf}
                        onChange={() => handleToggle('mostrarIrpf')}
                        className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Pie y Términos */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-neutral-900 border-b border-neutral-200 pb-1">
                  Datos de Pago, Cláusulas y Firmas
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Datos Bancarios (IBAN / Banco)</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarDatosBancarios}
                      onChange={() => handleToggle('mostrarDatosBancarios')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Condiciones y Cláusulas</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarCondiciones}
                      onChange={() => handleToggle('mostrarCondiciones')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Bloque de Firmas</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarFirmas}
                      onChange={() => handleToggle('mostrarFirmas')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-neutral-800 cursor-pointer p-1.5 hover:bg-neutral-50 rounded-xs">
                    <span>Mostrar Notas Legales al Pie</span>
                    <input
                      type="checkbox"
                      checked={config.mostrarNotasPie}
                      onChange={() => handleToggle('mostrarNotasPie')}
                      className="w-4 h-4 rounded-xs border-neutral-300 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEXTOS PERSONALIZADOS */}
          {activeTab === 'textos' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                  TEXTOS Y NOTAS ESPECÍFICAS
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Añade advertencias, datos legales o instrucciones adicionales que se imprimirán en el documento.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Notas adicionales al pie del documento
                </label>
                <textarea
                  rows={3}
                  value={config.notasPiePersonalizadas ?? ''}
                  onChange={(e) => handleUpdate('notasPiePersonalizadas', e.target.value)}
                  placeholder="Ej: Oferta sujeta a aceptación en 15 días. Entregas parciales sujetas a certificación técnica..."
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Condiciones contractuales adicionales
                </label>
                <textarea
                  rows={3}
                  value={config.condicionesPersonalizadas ?? ''}
                  onChange={(e) => handleUpdate('condicionesPersonalizadas', e.target.value)}
                  placeholder="Ej: Propiedad intelectual retenida por el autor hasta el pago total de la factura..."
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
                />
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/80 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onSaveDocument}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar en {isQuote ? 'presupuesto' : 'factura'}</span>
            </button>

            <button
              type="button"
              onClick={onSaveAsDefault}
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-sm cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              title="Todas las nuevas facturas/presupuestos nacerán con esta configuración"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-600" />
              <span>Guardar por defecto</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] font-mono text-neutral-500 hover:text-neutral-900 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer diseño original</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-mono uppercase text-neutral-600 hover:text-neutral-900 cursor-pointer font-semibold"
            >
              Cerrar panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
