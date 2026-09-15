import React, { useState, useRef } from 'react';
import {
  FileDown,
  Loader2,
  Trash2,
  Receipt,
  SlidersHorizontal,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { ViewMode, QuoteStatus, DocumentTemplateConfig } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { generateQuotePDF, exportElementToPDF } from '../../utils/pdfGenerator';
import { getMergedTemplateConfig, defaultQuoteTemplateConfig } from '../../utils/templateDefaults';
import { QuoteDocumentSheet } from '../../components/documents/QuoteDocumentSheet';
import { TemplateCustomizerDrawer } from '../../components/documents/TemplateCustomizerDrawer';

interface QuoteDetailProps {
  quoteId: string;
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const QuoteDetail: React.FC<QuoteDetailProps> = ({
  quoteId,
  onNavigate,
  onShowToast,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const db = storageService.getDatabase();
  const quote = db.quotes.find((q) => q.id === quoteId);
  const company = db.company;
  const settings = db.settings;

  // Initialize template config with quote override or default setting
  const [templateConfig, setTemplateConfig] = useState<DocumentTemplateConfig>(() => {
    return getMergedTemplateConfig(
      quote?.plantillaConfig || settings.plantillaPresupuestoDefecto,
      'quote'
    );
  });

  if (!quote) {
    return (
      <div className="space-y-6">
        <BackButton label="Volver a presupuestos" onClick={() => onNavigate('quotes')} />
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-sm">
          <p className="text-neutral-600">Presupuesto no encontrado en la base de datos.</p>
        </div>
      </div>
    );
  }

  const client = db.clients.find((c) => c.id === quote.clienteId);

  const handleStatusChange = (newStatus: QuoteStatus) => {
    const updated = {
      ...quote,
      estado: newStatus,
      fechaModificacion: new Date().toISOString().split('T')[0],
    };
    storageService.saveQuote(updated);
    onShowToast('success', `Estado de ${quote.id} actualizado a ${newStatus}.`);
  };

  const handleDelete = () => {
    storageService.deleteQuote(quote.id);
    onNavigate('quotes');
  };

  const handleSaveDocument = () => {
    const updated = {
      ...quote,
      plantillaConfig: templateConfig,
      fechaModificacion: new Date().toISOString().split('T')[0],
    };
    storageService.saveQuote(updated);
    onShowToast('success', `Diseño guardado específicamente en el presupuesto ${quote.id}.`);
  };

  const handleSaveAsDefault = () => {
    const currentSettings = storageService.getSettings();
    storageService.saveSettings({
      ...currentSettings,
      plantillaPresupuestoDefecto: templateConfig,
    });
    onShowToast('success', 'Plantilla guardada como predeterminada para todos los nuevos presupuestos.');
  };

  const handleReset = () => {
    setTemplateConfig({ ...defaultQuoteTemplateConfig });
    onShowToast('success', 'Diseño restablecido a la plantilla suiza minimalista original.');
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) {
      generateQuotePDF(quote, client, company);
      onShowToast('success', `Descargando PDF oficial de Presupuesto ${quote.id}...`);
      return;
    }

    try {
      setIsGeneratingPDF(true);
      onShowToast('loading', 'Generando PDF idéntico a la plantilla personalizada...');
      await exportElementToPDF(documentRef.current, `Presupuesto_${quote.id}.pdf`);
      onShowToast('success', `Descargado Presupuesto ${quote.id}.pdf con éxito.`);
    } catch (err) {
      console.error('Error al capturar PDF del presupuesto:', err);
      try {
        generateQuotePDF(quote, client, company);
        onShowToast('success', `Descargado Presupuesto ${quote.id}.pdf`);
      } catch (fallbackErr) {
        onShowToast('error', 'Error al generar el PDF del presupuesto.');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Top Bar with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <BackButton label="Volver a presupuestos" onClick={() => onNavigate('quotes')} />

        <div className="flex flex-wrap items-center gap-2">
          {/* Status selector */}
          <div className="flex items-center gap-1 bg-white border border-neutral-200 p-1 rounded-sm">
            <span className="text-[10px] font-mono text-neutral-400 px-2 uppercase">Estado:</span>
            {(['Borrador', 'Enviado', 'Aceptado', 'Rechazado'] as QuoteStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusChange(st)}
                className={`px-2 py-1 text-[11px] font-mono uppercase rounded-xs cursor-pointer transition-colors ${
                  quote.estado === st
                    ? 'bg-neutral-900 text-white font-bold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Customize Template Button */}
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-sm cursor-pointer shadow-xs transition-colors"
            title="Cambiar modelo de plantilla, ocultar/mostrar datos y cambiar colores"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-700" />
            <span>Personalizar Plantilla</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 rounded-sm cursor-pointer shadow-xs transition-opacity"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('invoice-builder')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Facturar este presupuesto</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 border border-neutral-200 rounded-sm cursor-pointer"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Official Printable Customizable Document */}
      <QuoteDocumentSheet
        quote={quote}
        client={client}
        company={company}
        config={templateConfig}
        documentRef={documentRef}
      />

      {/* Template Customizer Drawer */}
      <TemplateCustomizerDrawer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        documentType="quote"
        config={templateConfig}
        onChange={(newCfg) => setTemplateConfig(newCfg)}
        onSaveDocument={handleSaveDocument}
        onSaveAsDefault={handleSaveAsDefault}
        onReset={handleReset}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar presupuesto"
        message={`¿Estás seguro de que deseas eliminar el presupuesto "${quote.id}"? Esta acción borrará el documento de la base de datos.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
