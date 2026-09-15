import React, { useState, useRef } from 'react';
import {
  FileDown,
  Loader2,
  Trash2,
  CreditCard,
  SlidersHorizontal,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { ViewMode, InvoiceStatus, DocumentTemplateConfig } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { formatDateES, formatCurrency, calculateLineTotal, getTodayISO } from '../../utils/formatters';
import { generateInvoicePDF, exportElementToPDF } from '../../utils/pdfGenerator';
import { getMergedTemplateConfig, defaultInvoiceTemplateConfig } from '../../utils/templateDefaults';
import { InvoiceDocumentSheet } from '../../components/documents/InvoiceDocumentSheet';
import { TemplateCustomizerDrawer } from '../../components/documents/TemplateCustomizerDrawer';

interface InvoiceDetailProps {
  invoiceId: string;
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  invoiceId,
  onNavigate,
  onShowToast,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria');
  const documentRef = useRef<HTMLDivElement>(null);

  const db = storageService.getDatabase();
  const invoice = db.invoices.find((i) => i.id === invoiceId);
  const company = db.company;
  const settings = db.settings;

  // Initialize template config with invoice override or default setting
  const [templateConfig, setTemplateConfig] = useState<DocumentTemplateConfig>(() => {
    return getMergedTemplateConfig(
      invoice?.plantillaConfig || settings.plantillaFacturaDefecto,
      'invoice'
    );
  });

  if (!invoice) {
    return (
      <div className="space-y-6">
        <BackButton label="Volver a facturas" onClick={() => onNavigate('invoices')} />
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-sm">
          <p className="text-neutral-600">Factura no encontrada en la base de datos.</p>
        </div>
      </div>
    );
  }

  const client = db.clients.find((c) => c.id === invoice.clienteId);

  const handleDelete = () => {
    storageService.deleteInvoice(invoice.id);
    onNavigate('invoices');
  };

  const handleSaveDocument = () => {
    const updated = {
      ...invoice,
      plantillaConfig: templateConfig,
      fechaModificacion: getTodayISO(),
    };
    storageService.saveInvoice(updated);
    onShowToast('success', `Diseño guardado específicamente en la factura ${invoice.id}.`);
  };

  const handleSaveAsDefault = () => {
    const currentSettings = storageService.getSettings();
    storageService.saveSettings({
      ...currentSettings,
      plantillaFacturaDefecto: templateConfig,
    });
    onShowToast('success', 'Plantilla guardada como predeterminada para todas las nuevas facturas.');
  };

  const handleReset = () => {
    setTemplateConfig({ ...defaultInvoiceTemplateConfig });
    onShowToast('success', 'Diseño restablecido a la plantilla suiza minimalista original.');
  };

  const handleOpenPayment = () => {
    setPaymentAmount(invoice.importePendiente ?? 0);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    if (paymentAmount <= 0) {
      onShowToast('error', 'Introduce un importe de cobro válido mayor que cero.');
      return;
    }

    const newPagado = invoice.importePagado + paymentAmount;
    const newPendiente = Math.max(0, invoice.total - newPagado);

    let newEstado: InvoiceStatus = 'Parcial';
    if (newPendiente <= 0.01) {
      newEstado = 'Pagada';
    }

    const updated = {
      ...invoice,
      importePagado: newPagado,
      importePendiente: newPendiente,
      estado: newEstado,
      fechaModificacion: getTodayISO(),
    };

    storageService.saveInvoice(updated);

    // Also register in finances automatically as Income!
    storageService.saveFinance({
      id: `ING-${Date.now().toString().slice(-4)}`,
      tipo: 'Ingreso',
      concepto: `Cobro Factura ${invoice.id}`,
      descripcion: `Cobro Factura ${invoice.id}`,
      categoria: 'Ventas y Proyectos',
      importe: paymentAmount,
      fecha: getTodayISO(),
      clienteId: invoice.clienteId,
      facturaId: invoice.id,
      metodoPago: paymentMethod,
      metodo: paymentMethod,
      estado: 'Completado',
      notas: `Registro de cobro para la factura ${invoice.id}`,
    });

    setShowPaymentModal(false);
    onShowToast('success', `Cobro de ${formatCurrency(paymentAmount)} registrado correctamente.`);
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) {
      generateInvoicePDF(invoice, client, company);
      onShowToast('success', `Descargando PDF oficial de Factura ${invoice.id}...`);
      return;
    }

    try {
      setIsGeneratingPDF(true);
      onShowToast('loading', 'Generando PDF idéntico a la vista previa...');
      await exportElementToPDF(documentRef.current, `Factura_${invoice.id}.pdf`);
      onShowToast('success', `Descargada Factura ${invoice.id}.pdf con éxito.`);
    } catch (err) {
      console.error('Error al capturar PDF de la factura:', err);
      try {
        generateInvoicePDF(invoice, client, company);
        onShowToast('success', `Descargada Factura ${invoice.id}.pdf`);
      } catch (fallbackErr) {
        onShowToast('error', 'Error al generar el PDF de la factura.');
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Top Bar with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <BackButton label="Volver a facturas" onClick={() => onNavigate('invoices')} />

        <div className="flex flex-wrap items-center gap-2">
          {invoice.importePendiente > 0 && (
            <button
              type="button"
              onClick={handleOpenPayment}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Registrar cobro</span>
            </button>
          )}

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
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 border border-neutral-200 rounded-sm cursor-pointer"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Payment Status Alert Box */}
      <div className="bg-white border border-neutral-200 rounded-sm p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <StatusBadge status={invoice.estado} />
          <div className="text-xs">
            <span className="text-neutral-500">Total: </span>
            <span className="font-mono font-bold text-neutral-950 mr-3">{formatCurrency(invoice.total)}</span>
            <span className="text-neutral-500">Cobrado: </span>
            <span className="font-mono font-bold text-neutral-900 mr-3">{formatCurrency(invoice.importePagado)}</span>
            <span className="text-neutral-500">Pendiente: </span>
            <span className="font-mono font-bold text-neutral-900">{formatCurrency(invoice.importePendiente)}</span>
          </div>
        </div>

        {invoice.importePendiente > 0 && (
          <button
            type="button"
            onClick={handleOpenPayment}
            className="text-xs font-mono uppercase text-neutral-950 font-bold hover:underline cursor-pointer"
          >
            + Añadir pago parcial o total
          </button>
        )}
      </div>

      {/* Official Legal Printable Invoice */}
      <InvoiceDocumentSheet
        invoice={invoice}
        client={client}
        company={company}
        config={templateConfig}
        documentRef={documentRef}
      />

      {/* Template Customizer Drawer */}
      <TemplateCustomizerDrawer
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        documentType="invoice"
        config={templateConfig}
        onChange={(newCfg) => setTemplateConfig(newCfg)}
        onSaveDocument={handleSaveDocument}
        onSaveAsDefault={handleSaveAsDefault}
        onReset={handleReset}
      />

      {/* Register Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-300 rounded-sm shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-neutral-950">
                REGISTRAR COBRO — {invoice.id}
              </h2>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-neutral-400 hover:text-neutral-950 text-xs font-mono"
              >
                CERRAR
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Registra el ingreso recibido. Se actualizará el estado de la factura y se registrará automáticamente en el libro de Finanzas.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Importe del Cobro (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={invoice.importePendiente ?? 0}
                  value={paymentAmount ?? 0}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 font-mono font-bold"
                />
                <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                  Pendiente actual: {formatCurrency(invoice.importePendiente ?? 0)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod ?? 'Transferencia Bancaria'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950 cursor-pointer"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Domiciliación SEPA">Domiciliación SEPA</option>
                  <option value="Efectivo">Efectivo</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3.5 py-1.5 text-xs uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 rounded-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs"
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar factura"
        message={`¿Seguro que deseas eliminar la factura "${invoice.id}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
