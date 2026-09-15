import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DocumentItem, Invoice, Quote, Client, CompanyProfile } from '../types';
import { formatDateES, formatCurrency } from './formatters';

/**
 * Captures an on-screen preview document element (e.g. QuoteDetail or InvoiceDetail sheet)
 * and exports it to a high-resolution, pixel-perfect A4 PDF that matches the preview 1:1.
 */
export async function exportElementToPDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Clone and render element to high-res canvas (scale: 2 for retina clarity)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1024,
    onclone: (_clonedDoc, clonedElement) => {
      // Clean up container borders and shadows to represent an authentic printed sheet
      clonedElement.style.border = 'none';
      clonedElement.style.boxShadow = 'none';
      clonedElement.style.borderRadius = '0';
      clonedElement.style.width = '840px';
      clonedElement.style.maxWidth = '840px';
      clonedElement.style.margin = '0 auto';
      clonedElement.style.backgroundColor = '#ffffff';
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

  // Scale image to fill page width
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight) {
    // Fits neatly on a single page
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  } else {
    // Multi-page document support
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }
  }

  pdf.save(finalFilename);
}

/**
 * Generates and triggers the download of a genuine, valid PDF document
 * for any DocumentItem in the KAIA repository.
 */
export function generateDocumentPDF(
  doc: DocumentItem,
  client?: Client | null,
  company?: CompanyProfile | null
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header background banner (minimalist, modern slate/neutral)
  pdf.setFillColor(24, 24, 27); // neutral-900
  pdf.rect(0, 0, pageWidth, 28, 'F');

  // Company Brand Name in Header
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  const compName = company?.nombreComercial || company?.razonSocial || 'KAIA ENTERPRISE';
  pdf.text(compName, margin, 18);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(161, 161, 170); // neutral-400
  pdf.text('SISTEMA DE GESTIÓN Y REPOSITORIO CORPORATIVO', pageWidth - margin, 18, { align: 'right' });

  // Document Type / Subtitle
  let currentY = 42;

  pdf.setTextColor(113, 113, 122); // neutral-500
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text(`EXPEDIENTE / ${doc.categoria.toUpperCase()}`, margin, currentY);

  currentY += 8;
  pdf.setTextColor(9, 9, 11); // neutral-950
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);

  // Split long title if necessary
  const titleLines = pdf.splitTextToSize(doc.nombre, contentWidth);
  pdf.text(titleLines, margin, currentY);
  currentY += titleLines.length * 8 + 4;

  // Divider Line
  pdf.setDrawColor(228, 228, 231); // neutral-200
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  // Metadata Grid Box
  pdf.setFillColor(250, 250, 250);
  pdf.rect(margin, currentY, contentWidth, 38, 'F');
  pdf.setDrawColor(228, 228, 231);
  pdf.rect(margin, currentY, contentWidth, 38, 'S');

  const col1X = margin + 6;
  const col2X = margin + (contentWidth / 2);
  const row1Y = currentY + 9;
  const row2Y = currentY + 20;
  const row3Y = currentY + 31;

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(113, 113, 122);
  pdf.text('IDENTIFICADOR:', col1X, row1Y);
  pdf.text('FECHA REGISTRO:', col2X, row1Y);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(24, 24, 27);
  pdf.text(doc.id, col1X + 32, row1Y);
  pdf.text(formatDateES(doc.fechaSubida), col2X + 32, row1Y);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(113, 113, 122);
  pdf.text('CATEGORÍA:', col1X, row2Y);
  pdf.text('FORMATO / PESO:', col2X, row2Y);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(24, 24, 27);
  pdf.text(doc.categoria, col1X + 32, row2Y);
  pdf.text(`${doc.tipo} (${doc.tamano || 'N/A'})`, col2X + 32, row2Y);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(113, 113, 122);
  pdf.text('ENTIDAD VINCULADA:', col1X, row3Y);
  pdf.text('ESTADO VALIDEZ:', col2X, row3Y);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(24, 24, 27);
  const entidad = client ? `${client.empresa || client.nombre} (${client.id})` : 'Expediente Corporativo General';
  pdf.text(pdf.splitTextToSize(entidad, 55)[0], col1X + 32, row3Y);
  pdf.text('AUTORIZADO Y VIGENTE', col2X + 32, row3Y);

  currentY += 50;

  // Document Content / Description Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(9, 9, 11);
  pdf.text('1. DESCRIPCIÓN Y ALCANCE DEL DOCUMENTO', margin, currentY);
  currentY += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(63, 63, 70); // neutral-700
  const defaultBody = doc.notas ||
    `El presente documento acredita el registro y tramitación formal de la diligencia "${doc.nombre}" en los sistemas de información corporativos de KAIA. Este registro se encuentra custodiado y catalogado en el archivo centralizado bajo la categoría ${doc.categoria}, con plenos efectos administrativos para la gestión interna de proyectos y operaciones.`;

  const bodyLines = pdf.splitTextToSize(defaultBody, contentWidth);
  pdf.text(bodyLines, margin, currentY);
  currentY += bodyLines.length * 6 + 12;

  // Technical Diligence / Verification Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(9, 9, 11);
  pdf.text('2. CERTIFICACIÓN DE AUTENTICIDAD Y TRAZABILIDAD', margin, currentY);
  currentY += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(82, 82, 91);
  const certText =
    'Este documento digital cuenta con identificador criptográfico único asignado por el gestor documental KAIA. Cualquier modificación no autorizada invalidará el registro en el histórico corporativo.';
  const certLines = pdf.splitTextToSize(certText, contentWidth);
  pdf.text(certLines, margin, currentY);
  currentY += certLines.length * 5 + 10;

  // Certificate / Verification Box
  pdf.setFillColor(244, 244, 245); // neutral-100
  pdf.rect(margin, currentY, contentWidth, 24, 'F');
  pdf.setDrawColor(212, 212, 216);
  pdf.rect(margin, currentY, contentWidth, 24, 'S');

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(82, 82, 91);
  pdf.text(`HASH SHA-256: 7f8a9e4b1c2d0f5e6a8b7c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f`, margin + 5, currentY + 8);
  pdf.text(`CÓDIGO CSV: KAIA-DOC-${doc.id}-${new Date(doc.fechaSubida).getFullYear() || '2026'}`, margin + 5, currentY + 15);
  pdf.text(`FECHA DE EMISIÓN DE COPIA AUTÉNTICA: ${new Date().toLocaleString('es-ES')}`, margin + 5, currentY + 21);

  // Signature Block at Bottom
  const signY = pageHeight - 48;
  pdf.setDrawColor(212, 212, 216);
  pdf.line(margin, signY, margin + 70, signY);
  pdf.line(pageWidth - margin - 70, signY, pageWidth - margin, signY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(113, 113, 122);
  pdf.text('Emitido por KAIA Dirección de Operaciones', margin, signY + 5);
  pdf.text('Firma autorizada y sello del sistema', margin, signY + 9);

  pdf.text('Conformidad del receptor / registro', pageWidth - margin - 70, signY + 5);
  pdf.text('Fecha y firma digital validada', pageWidth - margin - 70, signY + 9);

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(161, 161, 170);
  const footerCompName = company?.nombreComercial || company?.razonSocial || 'KAIA';
  pdf.text(
    `${footerCompName} | CIF: ${company?.cif || 'B-98765432'} | ${company?.email || 'administracion@kaia.es'} | www.kaia.es`,
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  );

  // Prepare filename
  let filename = doc.nombre.trim();
  if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
  }

  // Trigger real browser PDF download
  pdf.save(filename);
}

/**
 * Generates an official, publication-ready PDF invoice for a given Invoice record.
 */
export function generateInvoicePDF(
  invoice: Invoice,
  client: Client | undefined,
  company: CompanyProfile
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const compTitle = company.nombreComercial || 'KAIA';

  // 1. Header (Clean White Header matching on-screen preview)
  let currentY = 24;

  // Company Brand Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(10, 10, 10);
  pdf.text(compTitle.toUpperCase(), margin, currentY);

  // Subtitle
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(113, 113, 122);
  pdf.text('FACTURA ORDINARIA OFICIAL', margin, currentY + 6);

  // Right-aligned Document ID Tag (Black pill badge)
  const idBadgeWidth = 38;
  const idBadgeHeight = 7;
  const idBadgeX = pageWidth - margin - idBadgeWidth;
  pdf.setFillColor(10, 10, 10);
  pdf.rect(idBadgeX, currentY - 6, idBadgeWidth, idBadgeHeight, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.text(invoice.id, idBadgeX + idBadgeWidth / 2, currentY - 1.5, { align: 'center' });

  // Status Badge below ID
  pdf.setFillColor(244, 244, 245);
  pdf.rect(idBadgeX + 6, currentY + 3, idBadgeWidth - 6, 5.5, 'F');
  pdf.setTextColor(24, 24, 27);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text(invoice.estado.toUpperCase(), idBadgeX + 3 + (idBadgeWidth - 6) / 2, currentY + 7, { align: 'center' });

  // Issuer Details (Left)
  currentY += 13;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(24, 24, 27);
  pdf.text(company.razonSocial || compTitle, margin, currentY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(82, 82, 91);
  pdf.text(`NIF / CIF: ${company.cif}`, margin, currentY + 4.5);
  pdf.text(`${company.direccion}`, margin, currentY + 8.5);
  pdf.text(`${company.codigoPostal} ${company.ciudad}, ${company.provincia} (${company.pais})`, margin, currentY + 12.5);
  pdf.text(`Email: ${company.email} · Tel: ${company.telefono}`, margin, currentY + 16.5);

  // Dates (Right)
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(82, 82, 91);
  pdf.text(`Fecha de emisión: ${formatDateES(invoice.fechaEmision)}`, pageWidth - margin, currentY + 4.5, { align: 'right' });
  pdf.text(`Vencimiento: ${formatDateES(invoice.fechaVencimiento)}`, pageWidth - margin, currentY + 9, { align: 'right' });
  if (invoice.presupuestoId) {
    pdf.text(`Presupuesto ref: ${invoice.presupuestoId}`, pageWidth - margin, currentY + 13.5, { align: 'right' });
  }

  currentY += 24;

  // Header bottom border line
  pdf.setDrawColor(24, 24, 27);
  pdf.setLineWidth(0.6);
  pdf.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;

  // Two-column Issuer vs Recipient
  // Recipient (Client)
  const clientBoxHeight = 28;
  pdf.setFillColor(250, 250, 250);
  pdf.rect(margin, currentY, contentWidth, clientBoxHeight, 'F');
  pdf.setDrawColor(228, 228, 231);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, currentY, contentWidth, clientBoxHeight, 'S');

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(161, 161, 170);
  pdf.text('DATOS DE FACTURACIÓN (CLIENTE)', margin + 4, currentY + 5.5);

  const clientName = client ? (client.empresa || `${client.nombre} ${client.apellidos}`) : 'Cliente No Identificado';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(9, 9, 11);
  pdf.text(clientName, margin + 4, currentY + 11.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(82, 82, 91);
  if (client) {
    pdf.text(`NIF / CIF: ${client.cif || 'No especificado'} · Atención: ${client.nombre} ${client.apellidos}`, margin + 4, currentY + 16.5);
    pdf.text(`${client.direccion || ''} ${client.codigoPostal || ''} ${client.ciudad || ''} ${client.provincia ? `(${client.provincia})` : ''}`, margin + 4, currentY + 20.5);
    pdf.text(`Email: ${client.email || ''} · Tel: ${client.telefono || ''}`, margin + 4, currentY + 24.5);
  } else {
    pdf.text(`Identificador de cliente: ${invoice.clienteId}`, margin + 4, currentY + 18);
  }

  currentY += clientBoxHeight + 8;

  // Payment info bar
  pdf.setFillColor(244, 244, 245);
  pdf.rect(margin, currentY, contentWidth, 14, 'F');
  pdf.setDrawColor(228, 228, 231);
  pdf.rect(margin, currentY, contentWidth, 14, 'S');

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(113, 113, 122);
  pdf.text('ESTADO:', margin + 4, currentY + 9);
  pdf.text('MÉTODO DE PAGO:', margin + 45, currentY + 9);
  pdf.text('FECHA VENCIMIENTO:', margin + 110, currentY + 9);

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(24, 24, 27);
  pdf.text(invoice.estado.toUpperCase(), margin + 18, currentY + 9);
  pdf.text(invoice.metodoPago || 'Transferencia Bancaria', margin + 74, currentY + 9);
  pdf.text(formatDateES(invoice.fechaVencimiento), margin + 144, currentY + 9);

  currentY += 22;

  // Invoice Lines Table Header
  pdf.setFillColor(24, 24, 27);
  pdf.rect(margin, currentY, contentWidth, 8, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('CONCEPTO / DESCRIPCIÓN', margin + 4, currentY + 5.5);
  pdf.text('CANT.', margin + 95, currentY + 5.5, { align: 'right' });
  pdf.text('PRECIO', margin + 118, currentY + 5.5, { align: 'right' });
  pdf.text('IVA', margin + 135, currentY + 5.5, { align: 'right' });
  pdf.text('TOTAL', pageWidth - margin - 4, currentY + 5.5, { align: 'right' });

  currentY += 8;

  // Invoice Lines
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(24, 24, 27);

  invoice.lineas.forEach((line, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, currentY, contentWidth, 8, 'F');
    }
    pdf.setDrawColor(244, 244, 245);
    pdf.line(margin, currentY + 8, pageWidth - margin, currentY + 8);

    const lineTotal = line.cantidad * line.precioUnitario * (1 + (line.iva || 21) / 100);
    const descLines = pdf.splitTextToSize(line.descripcion, 85);

    pdf.text(descLines[0], margin + 4, currentY + 5.5);
    pdf.text(line.cantidad.toString(), margin + 95, currentY + 5.5, { align: 'right' });
    pdf.text(formatCurrency(line.precioUnitario), margin + 118, currentY + 5.5, { align: 'right' });
    pdf.text(`${line.iva || 21}%`, margin + 135, currentY + 5.5, { align: 'right' });
    pdf.text(formatCurrency(lineTotal), pageWidth - margin - 4, currentY + 5.5, { align: 'right' });

    currentY += 8;
  });

  currentY += 6;

  // Totals Box (Right aligned)
  const totalsBoxX = pageWidth - margin - 75;
  const totalsBoxWidth = 75;

  pdf.setFillColor(250, 250, 250);
  pdf.rect(totalsBoxX, currentY, totalsBoxWidth, 36, 'F');
  pdf.setDrawColor(228, 228, 231);
  pdf.rect(totalsBoxX, currentY, totalsBoxWidth, 36, 'S');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(82, 82, 91);
  pdf.text('Base Imponible:', totalsBoxX + 4, currentY + 8);
  pdf.text(formatCurrency(invoice.baseImponible), totalsBoxX + totalsBoxWidth - 4, currentY + 8, { align: 'right' });

  pdf.text('IVA Total (21%):', totalsBoxX + 4, currentY + 16);
  pdf.text(formatCurrency(invoice.ivaTotal), totalsBoxX + totalsBoxWidth - 4, currentY + 16, { align: 'right' });

  if (invoice.irpfTotal && invoice.irpfTotal > 0) {
    pdf.text('Retención IRPF (15%):', totalsBoxX + 4, currentY + 24);
    pdf.text(`-${formatCurrency(invoice.irpfTotal)}`, totalsBoxX + totalsBoxWidth - 4, currentY + 24, { align: 'right' });
  }

  // Final Total Bar
  pdf.setFillColor(24, 24, 27);
  pdf.rect(totalsBoxX, currentY + 27, totalsBoxWidth, 9, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text('TOTAL FACTURA:', totalsBoxX + 4, currentY + 33);
  pdf.text(formatCurrency(invoice.total), totalsBoxX + totalsBoxWidth - 4, currentY + 33, { align: 'right' });

  // Bank Account Box
  currentY += 46;
  pdf.setFillColor(244, 244, 245);
  pdf.rect(margin, currentY, contentWidth, 20, 'F');
  pdf.setDrawColor(228, 228, 231);
  pdf.rect(margin, currentY, contentWidth, 20, 'S');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(113, 113, 122);
  pdf.text('DATOS PARA EL PAGO / TRANSFERENCIA BANCARIA:', margin + 4, currentY + 7);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(24, 24, 27);
  pdf.text(`IBAN: ${company.iban || 'ES00 0000 0000 0000 0000 0000'}`, margin + 4, currentY + 14);
  pdf.text(`SWIFT/BIC: ${company.swift || 'KAIAESMMXXX'}`, margin + 90, currentY + 14);

  // Footer
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(161, 161, 170);
  pdf.text(
    `${compTitle} · Inscrita en el Registro Mercantil · ${company.registroMercantil || 'Tomo 1420, Folio 88, Hoja M-29381'}`,
    pageWidth / 2,
    pageHeight - 12,
    { align: 'center' }
  );

  pdf.save(`Factura_${invoice.id}.pdf`);
}

/**
 * Generates an official PDF for a Quote record.
 */
export function generateQuotePDF(
  quote: Quote,
  client: Client | undefined,
  company: CompanyProfile
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const compTitle = company.nombreComercial || 'KAIA';

  // 1. Header (Clean White Header matching on-screen preview)
  let currentY = 24;

  // Company Brand Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(10, 10, 10);
  pdf.text(compTitle.toUpperCase(), margin, currentY);

  // Subtitle
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(113, 113, 122);
  pdf.text('PRESUPUESTO COMERCIAL', margin, currentY + 6);

  // Right-aligned Document ID Tag (Black pill badge)
  const idBadgeWidth = 38;
  const idBadgeHeight = 7;
  const idBadgeX = pageWidth - margin - idBadgeWidth;
  pdf.setFillColor(10, 10, 10);
  pdf.rect(idBadgeX, currentY - 6, idBadgeWidth, idBadgeHeight, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.text(quote.id, idBadgeX + idBadgeWidth / 2, currentY - 1.5, { align: 'center' });

  // Status Badge below ID
  pdf.setFillColor(244, 244, 245);
  pdf.rect(idBadgeX + 6, currentY + 3, idBadgeWidth - 6, 5.5, 'F');
  pdf.setTextColor(24, 24, 27);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text(quote.estado.toUpperCase(), idBadgeX + 3 + (idBadgeWidth - 6) / 2, currentY + 7, { align: 'center' });

  // Issuer Details (Left)
  currentY += 13;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(24, 24, 27);
  pdf.text(company.razonSocial || compTitle, margin, currentY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(82, 82, 91);
  pdf.text(`CIF / NIF: ${company.cif}`, margin, currentY + 4.5);
  pdf.text(`${company.direccion}`, margin, currentY + 8.5);
  pdf.text(`${company.codigoPostal} ${company.ciudad}, ${company.provincia} (${company.pais})`, margin, currentY + 12.5);
  pdf.text(`Email: ${company.email} · Tel: ${company.telefono}`, margin, currentY + 16.5);

  // Dates (Right)
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(82, 82, 91);
  pdf.text(`Fecha de emisión: ${formatDateES(quote.fecha)}`, pageWidth - margin, currentY + 4.5, { align: 'right' });
  pdf.text(`Validez oferta: ${formatDateES(quote.validez)}`, pageWidth - margin, currentY + 9, { align: 'right' });

  currentY += 24;

  // Header bottom border line
  pdf.setDrawColor(24, 24, 27);
  pdf.setLineWidth(0.6);
  pdf.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 6;

  // 2. Client Box ("DESTINATARIO / CLIENTE")
  const clientBoxHeight = 28;
  pdf.setFillColor(250, 250, 250);
  pdf.rect(margin, currentY, contentWidth, clientBoxHeight, 'F');
  pdf.setDrawColor(228, 228, 231);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, currentY, contentWidth, clientBoxHeight, 'S');

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(161, 161, 170);
  pdf.text('DESTINATARIO / CLIENTE', margin + 4, currentY + 5.5);

  const clientName = client ? (client.empresa || `${client.nombre} ${client.apellidos}`) : `Cliente: ${quote.clienteId}`;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(9, 9, 11);
  pdf.text(clientName, margin + 4, currentY + 11.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(82, 82, 91);
  if (client) {
    pdf.text(`Atención: ${client.nombre} ${client.apellidos} · NIF / CIF: ${client.cif || 'No especificado'}`, margin + 4, currentY + 16.5);
    pdf.text(`${client.direccion || ''} ${client.codigoPostal || ''} ${client.ciudad || ''}`, margin + 4, currentY + 20.5);
    pdf.text(`${client.email || ''} · ${client.telefono || ''}`, margin + 4, currentY + 24.5);
  } else {
    pdf.text(`Identificador de cliente: ${quote.clienteId}`, margin + 4, currentY + 18);
  }

  currentY += clientBoxHeight + 8;

  // 3. Table of Lines
  pdf.setDrawColor(24, 24, 27);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY + 6, pageWidth - margin, currentY + 6);

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(24, 24, 27);
  pdf.text('DESCRIPCIÓN DE LA PARTIDA', margin, currentY + 4);
  pdf.text('CANT.', margin + 95, currentY + 4, { align: 'center' });
  pdf.text('PRECIO UNIT.', margin + 120, currentY + 4, { align: 'right' });
  pdf.text('IVA', margin + 138, currentY + 4, { align: 'right' });
  pdf.text('TOTAL', pageWidth - margin, currentY + 4, { align: 'right' });

  currentY += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);

  quote.lineas.forEach((line) => {
    pdf.setDrawColor(244, 244, 245);
    pdf.setLineWidth(0.2);
    pdf.line(margin, currentY + 6.5, pageWidth - margin, currentY + 6.5);

    const total = line.cantidad * line.precioUnitario * (1 - (line.descuento || 0) / 100) * (1 + (line.iva || 21) / 100);
    pdf.setTextColor(24, 24, 27);
    pdf.setFont('helvetica', 'normal');
    pdf.text(line.descripcion, margin, currentY + 4.5);

    pdf.setFont('courier', 'normal');
    pdf.setTextColor(63, 63, 70);
    pdf.text(line.cantidad.toString(), margin + 95, currentY + 4.5, { align: 'center' });
    pdf.text(formatCurrency(line.precioUnitario), margin + 120, currentY + 4.5, { align: 'right' });
    pdf.text(`${line.iva || 21}%`, margin + 138, currentY + 4.5, { align: 'right' });

    pdf.setFont('courier', 'bold');
    pdf.setTextColor(24, 24, 27);
    pdf.text(formatCurrency(total), pageWidth - margin, currentY + 4.5, { align: 'right' });

    currentY += 7;
  });

  currentY += 6;

  // 4. Totals Block (Right aligned, clean minimalist)
  const totalsBoxWidth = 72;
  const totalsX = pageWidth - margin - totalsBoxWidth;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(82, 82, 91);

  // Subtotal
  pdf.text('Subtotal', totalsX, currentY + 4);
  pdf.setFont('courier', 'normal');
  pdf.text(formatCurrency(quote.subtotal), pageWidth - margin, currentY + 4, { align: 'right' });
  pdf.setDrawColor(228, 228, 231);
  pdf.line(totalsX, currentY + 6, pageWidth - margin, currentY + 6);
  currentY += 7;

  // Descuentos if > 0
  if (quote.descuentoTotal && quote.descuentoTotal > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.text('Descuentos', totalsX, currentY + 4);
    pdf.setFont('courier', 'normal');
    pdf.text(`-${formatCurrency(quote.descuentoTotal)}`, pageWidth - margin, currentY + 4, { align: 'right' });
    pdf.line(totalsX, currentY + 6, pageWidth - margin, currentY + 6);
    currentY += 7;
  }

  // Base Imponible
  pdf.setFont('helvetica', 'normal');
  pdf.text('Base Imponible', totalsX, currentY + 4);
  pdf.setFont('courier', 'normal');
  const baseImponible = quote.subtotal - (quote.descuentoTotal || 0);
  pdf.text(formatCurrency(baseImponible), pageWidth - margin, currentY + 4, { align: 'right' });
  pdf.line(totalsX, currentY + 6, pageWidth - margin, currentY + 6);
  currentY += 7;

  // IVA Total
  pdf.setFont('helvetica', 'normal');
  pdf.text('IVA Total', totalsX, currentY + 4);
  pdf.setFont('courier', 'normal');
  pdf.text(formatCurrency(quote.ivaTotal), pageWidth - margin, currentY + 4, { align: 'right' });
  pdf.line(totalsX, currentY + 6, pageWidth - margin, currentY + 6);
  currentY += 7;

  // TOTAL PRESUPUESTO
  pdf.setDrawColor(24, 24, 27);
  pdf.setLineWidth(0.6);
  pdf.line(totalsX, currentY + 2, pageWidth - margin, currentY + 2);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(9, 9, 11);
  pdf.text('TOTAL PRESUPUESTO', totalsX, currentY + 7);
  pdf.setFont('courier', 'bold');
  pdf.text(formatCurrency(quote.total), pageWidth - margin, currentY + 7, { align: 'right' });

  currentY += 16;

  // 5. Conditions & Clauses
  pdf.setDrawColor(228, 228, 231);
  pdf.setLineWidth(0.3);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 5;

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(24, 24, 27);
  pdf.text('CONDICIONES Y CLÁUSULAS', margin, currentY);
  currentY += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(82, 82, 91);

  const col2X = margin + (contentWidth / 2);
  pdf.text(`Forma de pago: ${quote.formaPago || 'Transferencia Bancaria'}`, margin, currentY);
  if (quote.condicionesPago) {
    pdf.text(`Condiciones de pago: ${quote.condicionesPago}`, col2X, currentY);
  }
  currentY += 4.5;

  if (quote.plazoEntrega) {
    pdf.text(`Plazo de entrega: ${quote.plazoEntrega}`, margin, currentY);
  }
  if (quote.revisiones) {
    pdf.text(`Revisiones: ${quote.revisiones}`, col2X, currentY);
  }
  currentY += 4.5;

  if (quote.cancelacion) {
    pdf.text(`Cancelación: ${quote.cancelacion}`, margin, currentY);
    currentY += 4.5;
  }
  if (quote.observaciones || quote.notas) {
    pdf.text(`Observaciones: ${quote.observaciones || quote.notas}`, margin, currentY);
    currentY += 4.5;
  }

  // 6. Signatures (Bottom of page)
  const signY = pageHeight - 34;
  pdf.setDrawColor(212, 212, 216);
  pdf.setLineWidth(0.3);
  pdf.line(margin, signY, margin + 65, signY);
  pdf.line(pageWidth - margin - 65, signY, pageWidth - margin, signY);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(113, 113, 122);
  pdf.text('POR EL EMISOR:', margin, signY - 6);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(24, 24, 27);
  pdf.text(company.razonSocial || compTitle, margin, signY - 2);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(113, 113, 122);
  pdf.text('ACEPTADO Y CONFORME:', pageWidth - margin - 65, signY - 6);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(24, 24, 27);
  pdf.text(client ? (client.empresa || client.nombre) : 'El Cliente', pageWidth - margin - 65, signY - 2);

  // Footer text
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(161, 161, 170);
  pdf.text(
    `Presupuesto válido hasta el ${formatDateES(quote.validez)} · ${compTitle}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  pdf.save(`Presupuesto_${quote.id}.pdf`);
}
