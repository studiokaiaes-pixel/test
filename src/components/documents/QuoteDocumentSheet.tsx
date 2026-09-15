import React from 'react';
import { Quote, Client, CompanyProfile, DocumentTemplateConfig } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDateES, formatCurrency, calculateLineTotal } from '../../utils/formatters';

interface QuoteDocumentSheetProps {
  quote: Quote;
  client?: Client | null;
  company: CompanyProfile;
  config: DocumentTemplateConfig;
  documentRef: React.RefObject<HTMLDivElement | null>;
}

export const QuoteDocumentSheet: React.FC<QuoteDocumentSheetProps> = ({
  quote,
  client,
  company,
  config,
  documentRef,
}) => {
  const fontClass =
    config.fuente === 'serif'
      ? 'font-serif'
      : config.fuente === 'mono'
      ? 'font-mono'
      : 'font-sans';

  const accentColor = config.colorAcento || '#0a0a0a';
  const title = config.tituloPersonalizado || 'PRESUPUESTO COMERCIAL';
  const subtitle = config.subtituloPersonalizado || 'PROPUESTA DE SERVICIOS Y ESTIMACIÓN';

  // MODEL 1: SUIZO MINIMALISTA
  const renderMinimalista = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-neutral-900 pb-6">
        <div>
          {config.mostrarLogo && (
            <h1 className="text-3xl font-bold tracking-widest text-neutral-950 font-mono">
              {company.nombreComercial || 'KAIA'}
            </h1>
          )}
          <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider mt-1">
            {title}
          </p>
          {config.mostrarDatosEmpresa && (
            <div className="text-xs text-neutral-600 mt-3 space-y-0.5">
              <p className="font-semibold text-neutral-900">{company.razonSocial}</p>
              {config.mostrarCifEmpresa && <p>CIF / NIF: {company.cif}</p>}
              {config.mostrarDireccionEmpresa && (
                <>
                  <p>{company.direccion}</p>
                  <p>
                    {company.codigoPostal} {company.ciudad}, {company.provincia} ({company.pais})
                  </p>
                </>
              )}
              {config.mostrarContactoEmpresa && (
                <p>Email: {company.email} · Tel: {company.telefono}</p>
              )}
            </div>
          )}
        </div>

        <div className="text-right">
          <div
            className="inline-block text-white font-mono text-xs px-3.5 py-1.5 font-bold"
            style={{ backgroundColor: accentColor }}
          >
            {quote.id}
          </div>
          {config.mostrarEstado && (
            <div className="mt-2 flex justify-end">
              <StatusBadge status={quote.estado} />
            </div>
          )}
          {config.mostrarFechas && (
            <div className="text-xs text-neutral-600 mt-3 space-y-1 font-mono">
              <p>
                <span className="text-neutral-400">Fecha de emisión:</span> {formatDateES(quote.fecha)}
              </p>
              {config.mostrarValidezVencimiento && (
                <p>
                  <span className="text-neutral-400">Validez oferta:</span> {formatDateES(quote.validez)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Client Block */}
      {config.mostrarDatosCliente && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
            DESTINATARIO / CLIENTE
          </span>
          {client ? (
            <div className="text-xs text-neutral-800 space-y-0.5">
              <p className="font-bold text-sm text-neutral-950">
                {client.empresa || `${client.nombre} ${client.apellidos}`}
              </p>
              <p>Atención: {client.nombre} {client.apellidos}</p>
              {config.mostrarCifCliente && <p>NIF / CIF: {client.cif || 'No especificado'}</p>}
              {config.mostrarDireccionCliente && (
                <p>{client.direccion} {client.codigoPostal} {client.ciudad}</p>
              )}
              {config.mostrarContactoCliente && (
                <p>{client.email} · {client.telefono}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 font-mono">ID Cliente: {quote.clienteId}</p>
          )}
        </div>
      )}

      {/* Lines Table */}
      {renderLinesTable('minimal')}

      {/* Totals Section */}
      {renderTotalsSection()}

      {/* Conditions */}
      {renderConditionsSection()}

      {/* Signatures */}
      {renderSignatures()}
    </div>
  );

  // MODEL 2: EJECUTIVO / CORPORATIVO
  const renderEjecutivo = () => (
    <div className="space-y-8">
      {/* Top corporate accent bar */}
      <div
        className="-mt-8 -mx-8 sm:-mt-14 sm:-mx-14 h-3.5"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-neutral-200">
        <div>
          {config.mostrarLogo && (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-sm flex items-center justify-center text-white font-mono font-bold text-base shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                {(company.nombreComercial || 'K').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-950">
                  {company.nombreComercial || 'KAIA'}
                </h1>
                <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wide">
                  {company.razonSocial}
                </p>
              </div>
            </div>
          )}

          {config.mostrarDatosEmpresa && (
            <div className="text-xs text-neutral-600 mt-3 space-y-0.5">
              {config.mostrarCifEmpresa && (
                <p>
                  <span className="font-semibold text-neutral-800">CIF:</span> {company.cif}
                </p>
              )}
              {config.mostrarDireccionEmpresa && (
                <p>{company.direccion} · {company.codigoPostal} {company.ciudad}</p>
              )}
              {config.mostrarContactoEmpresa && (
                <p>{company.email} · {company.telefono}</p>
              )}
            </div>
          )}
        </div>

        <div className="text-right sm:self-start">
          <span
            className="text-xs font-mono font-bold uppercase tracking-widest block"
            style={{ color: accentColor }}
          >
            {title}
          </span>
          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{subtitle}</p>
          <div className="mt-2 inline-block px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-sm font-mono text-xs font-bold text-neutral-950">
            Nº: {quote.id}
          </div>

          {config.mostrarFechas && (
            <div className="text-xs text-neutral-600 mt-2 space-y-0.5 font-mono">
              <p>Fecha emisión: <span className="font-semibold text-neutral-900">{formatDateES(quote.fecha)}</span></p>
              {config.mostrarValidezVencimiento && (
                <p>Validez oferta: <span className="font-semibold text-neutral-900">{formatDateES(quote.validez)}</span></p>
              )}
            </div>
          )}
          {config.mostrarEstado && (
            <div className="mt-2 flex justify-end">
              <StatusBadge status={quote.estado} />
            </div>
          )}
        </div>
      </div>

      {/* Client Block with colored left border */}
      {config.mostrarDatosCliente && (
        <div
          className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm"
          style={{ borderLeftWidth: '4px', borderLeftColor: accentColor }}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
            CLIENTE / EMPRESA CONTRATANTE
          </span>
          {client ? (
            <div className="text-xs text-neutral-800 space-y-0.5">
              <p className="font-bold text-sm text-neutral-950">
                {client.empresa || `${client.nombre} ${client.apellidos}`}
              </p>
              <p>Contacto: {client.nombre} {client.apellidos}</p>
              {config.mostrarCifCliente && <p>NIF / CIF: {client.cif || 'No especificado'}</p>}
              {config.mostrarDireccionCliente && (
                <p>{client.direccion} {client.codigoPostal} {client.ciudad}</p>
              )}
              {config.mostrarContactoCliente && (
                <p>{client.email} · {client.telefono}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 font-mono">ID Cliente: {quote.clienteId}</p>
          )}
        </div>
      )}

      {/* Lines Table with Solid Header */}
      {renderLinesTable('solid')}

      {/* Totals Section */}
      {renderTotalsSection()}

      {/* Conditions */}
      {renderConditionsSection()}

      {/* Signatures */}
      {renderSignatures()}
    </div>
  );

  // MODEL 3: TÉCNICO / CUADRÍCULA
  const renderTecnico = () => (
    <div className="space-y-6">
      {/* Technical Grid Header */}
      <div className="border border-neutral-950">
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-neutral-950 divide-y md:divide-y-0 md:divide-x divide-neutral-950">
          <div className="p-4">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 block">
              01. EMISOR DEL DOCUMENTO
            </span>
            <h2 className="text-lg font-bold font-mono text-neutral-950 mt-1">
              {company.nombreComercial || 'KAIA'}
            </h2>
            <p className="text-[11px] font-mono text-neutral-600">{company.razonSocial}</p>
            {config.mostrarCifEmpresa && (
              <p className="text-[11px] font-mono text-neutral-600 mt-1">CIF: {company.cif}</p>
            )}
          </div>

          <div className="p-4">
            <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 block">
              02. METADATOS TÉCNICOS
            </span>
            <p className="text-sm font-bold font-mono text-neutral-950 mt-1">{title}</p>
            <div className="text-[11px] font-mono text-neutral-700 mt-1 space-y-0.5">
              <p>REF: <span className="font-bold">{quote.id}</span></p>
              {config.mostrarFechas && <p>EMISIÓN: {formatDateES(quote.fecha)}</p>}
              {config.mostrarValidezVencimiento && <p>VALIDEZ: {formatDateES(quote.validez)}</p>}
            </div>
          </div>

          <div className="p-4 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 block">
                03. CONTROL DE ESTADO
              </span>
              <div className="mt-2">
                <StatusBadge status={quote.estado} />
              </div>
            </div>
            <div className="text-[10px] font-mono text-neutral-500 mt-2">
              MONEDA: EUR (€)
            </div>
          </div>
        </div>

        {/* Client in technical box */}
        {config.mostrarDatosCliente && (
          <div className="p-4 bg-neutral-50 font-mono">
            <span className="text-[9px] uppercase tracking-widest text-neutral-400 block mb-1">
              DESTINATARIO TÉCNICO / TITULAR
            </span>
            {client ? (
              <div className="text-xs text-neutral-900 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="font-bold">{client.empresa || `${client.nombre} ${client.apellidos}`}</p>
                  <p className="text-neutral-600">Att: {client.nombre} {client.apellidos}</p>
                  {config.mostrarCifCliente && <p className="text-neutral-600">NIF/CIF: {client.cif}</p>}
                </div>
                <div>
                  {config.mostrarDireccionCliente && (
                    <p className="text-neutral-600">{client.direccion} {client.codigoPostal} {client.ciudad}</p>
                  )}
                  {config.mostrarContactoCliente && (
                    <p className="text-neutral-600">{client.email} · {client.telefono}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500">CLIENTE ID: {quote.clienteId}</p>
            )}
          </div>
        )}
      </div>

      {/* Grid Lines Table */}
      {renderLinesTable('grid')}

      {/* Totals Section */}
      {renderTotalsSection()}

      {/* Conditions */}
      {renderConditionsSection()}

      {/* Signatures */}
      {renderSignatures()}
    </div>
  );

  // MODEL 4: EDITORIAL / ELEGANTE
  const renderEditorial = () => (
    <div className="space-y-8 font-serif">
      {/* Header */}
      <div className="text-center pb-6 border-b-2 border-neutral-900 space-y-2">
        {config.mostrarLogo && (
          <h1 className="text-4xl font-normal tracking-tight text-neutral-950 font-serif">
            {company.nombreComercial || 'KAIA'}
          </h1>
        )}
        <div className="flex items-center justify-center gap-2 text-xs font-sans tracking-widest uppercase text-neutral-500">
          <span>{title}</span>
          <span>·</span>
          <span>{quote.id}</span>
        </div>

        {config.mostrarDatosEmpresa && (
          <p className="text-xs font-sans text-neutral-500 max-w-lg mx-auto">
            {company.razonSocial} {config.mostrarCifEmpresa && `· CIF ${company.cif}`}
            {config.mostrarDireccionEmpresa && ` · ${company.direccion}, ${company.ciudad}`}
          </p>
        )}
      </div>

      {/* Editorial Meta row */}
      <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 py-2 border-b border-neutral-200 font-sans text-xs text-neutral-600">
        <div>
          {config.mostrarFechas && (
            <span>Fecha de Emisión: <strong>{formatDateES(quote.fecha)}</strong></span>
          )}
          {config.mostrarValidezVencimiento && (
            <span className="ml-4">Válido hasta: <strong>{formatDateES(quote.validez)}</strong></span>
          )}
        </div>
        {config.mostrarEstado && (
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Estado:</span>
            <StatusBadge status={quote.estado} />
          </div>
        )}
      </div>

      {/* Client Block */}
      {config.mostrarDatosCliente && (
        <div className="py-3 border-b border-neutral-200 font-sans">
          <span className="text-[10px] uppercase tracking-widest text-neutral-400 block mb-1 font-mono">
            PREPARADO PARA
          </span>
          {client ? (
            <div className="text-xs text-neutral-800 space-y-0.5">
              <p className="font-serif font-bold text-base text-neutral-950">
                {client.empresa || `${client.nombre} ${client.apellidos}`}
              </p>
              <p className="text-neutral-600">A la atención de {client.nombre} {client.apellidos}</p>
              {config.mostrarCifCliente && <p className="text-neutral-500">NIF / CIF: {client.cif}</p>}
              {config.mostrarDireccionCliente && (
                <p className="text-neutral-500">{client.direccion}, {client.ciudad}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 font-mono">Cliente ID: {quote.clienteId}</p>
          )}
        </div>
      )}

      {/* Lines Table */}
      {renderLinesTable('editorial')}

      {/* Totals Section */}
      {renderTotalsSection()}

      {/* Conditions */}
      {renderConditionsSection()}

      {/* Signatures */}
      {renderSignatures()}
    </div>
  );

  // Common Table of Lines
  const renderLinesTable = (styleType: 'minimal' | 'solid' | 'grid' | 'editorial') => {
    let headerClass = '';
    let tableClass = 'w-full text-left text-xs border-collapse';

    if (styleType === 'solid') {
      headerClass = 'text-white font-mono text-[10px] uppercase tracking-wider';
    } else if (styleType === 'grid') {
      headerClass = 'bg-neutral-100 text-neutral-900 font-mono text-[10px] uppercase tracking-wider border-b border-neutral-950';
      tableClass += ' border border-neutral-950 divide-y divide-neutral-200';
    } else if (styleType === 'editorial') {
      headerClass = 'border-b-2 border-neutral-900 text-neutral-900 font-serif text-xs italic tracking-wider';
    } else {
      headerClass = 'border-b-2 border-neutral-900 text-neutral-900 font-mono text-[10px] uppercase tracking-wider';
    }

    return (
      <div className="overflow-x-auto">
        <table className={tableClass}>
          <thead>
            <tr
              className={headerClass}
              style={styleType === 'solid' ? { backgroundColor: accentColor } : undefined}
            >
              <th className="py-2.5 px-3">Descripción de la Partida</th>
              <th className="py-2.5 px-2 text-center">Cant.</th>
              <th className="py-2.5 px-2 text-right">Precio Unit.</th>
              {config.mostrarColumnaIva && <th className="py-2.5 px-2 text-right">IVA</th>}
              {config.mostrarColumnaDescuento && <th className="py-2.5 px-2 text-right">Dto.</th>}
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {quote.lineas.map((line) => {
              const lCalc = calculateLineTotal(
                line.cantidad,
                line.precioUnitario,
                line.iva,
                line.descuento
              );
              return (
                <tr
                  key={line.id}
                  className={styleType === 'grid' ? 'divide-x divide-neutral-200 hover:bg-neutral-50/50' : 'hover:bg-neutral-50/40'}
                >
                  <td className="py-2.5 px-3 font-medium text-neutral-900">
                    {line.descripcion}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-neutral-700">
                    {line.cantidad}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-neutral-700">
                    {formatCurrency(line.precioUnitario)}
                  </td>
                  {config.mostrarColumnaIva && (
                    <td className="py-2.5 px-2 text-right font-mono text-neutral-500">
                      {line.iva}%
                    </td>
                  )}
                  {config.mostrarColumnaDescuento && (
                    <td className="py-2.5 px-2 text-right font-mono text-neutral-500">
                      {line.descuento > 0 ? `${line.descuento}%` : '-'}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-neutral-900">
                    {formatCurrency(lCalc.total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Totals Section
  const renderTotalsSection = () => (
    <div className="flex justify-end pt-2">
      <div className="w-72 space-y-1.5 text-xs text-neutral-700 font-sans">
        {config.mostrarDesgloseImpuestos && (
          <>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.descuentoTotal > 0 && config.mostrarColumnaDescuento && (
              <div className="flex justify-between py-1 border-b border-neutral-200 text-neutral-600">
                <span>Descuento aplicado</span>
                <span className="font-mono">-{formatCurrency(quote.descuentoTotal)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span>Base Imponible</span>
              <span className="font-mono">{formatCurrency(quote.subtotal - quote.descuentoTotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-200">
              <span>IVA Total</span>
              <span className="font-mono">{formatCurrency(quote.ivaTotal)}</span>
            </div>
          </>
        )}

        <div
          className="flex justify-between py-2.5 px-3 rounded-xs font-bold text-sm text-neutral-950 mt-2"
          style={{
            backgroundColor: `${accentColor}10`,
            borderLeft: `3px solid ${accentColor}`,
          }}
        >
          <span className="uppercase tracking-wider text-xs">TOTAL PRESUPUESTO</span>
          <span className="font-mono text-base">{formatCurrency(quote.total)}</span>
        </div>
      </div>
    </div>
  );

  // Conditions & Clauses
  const renderConditionsSection = () => {
    if (!config.mostrarCondiciones && !config.mostrarNotasPie) return null;

    return (
      <div className="pt-4 border-t border-neutral-200 space-y-3 text-xs text-neutral-700 font-sans">
        {config.mostrarCondiciones && (
          <>
            <h3 className="font-mono text-[10px] uppercase font-bold tracking-wider text-neutral-900">
              CONDICIONES Y CLÁUSULAS COMERCIALES
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-neutral-900">Forma de pago:</span>{' '}
                {quote.formaPago || 'Transferencia'}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Condiciones de pago:</span>{' '}
                {quote.condicionesPago}
              </div>
              {quote.plazoEntrega && (
                <div>
                  <span className="font-semibold text-neutral-900">Plazo de entrega:</span>{' '}
                  {quote.plazoEntrega}
                </div>
              )}
              {quote.revisiones && (
                <div>
                  <span className="font-semibold text-neutral-900">Revisiones:</span>{' '}
                  {quote.revisiones}
                </div>
              )}
            </div>
            {quote.cancelacion && (
              <div className="pt-1">
                <span className="font-semibold text-neutral-900">Cancelación:</span>{' '}
                {quote.cancelacion}
              </div>
            )}
            {config.condicionesPersonalizadas && (
              <div className="pt-1 text-neutral-600">
                {config.condicionesPersonalizadas}
              </div>
            )}
          </>
        )}

        {/* Bank account if enabled */}
        {config.mostrarDatosBancarios && company.iban && (
          <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-sm font-mono text-xs">
            <span className="text-neutral-500 block text-[10px]">DATOS PARA ABONO / TRANSFERENCIA:</span>
            <span className="font-bold text-neutral-900">{company.iban}</span>
            {company.banco && <span className="text-neutral-500 ml-2">({company.banco})</span>}
          </div>
        )}

        {/* Footer legal notes */}
        {config.mostrarNotasPie && (
          <div className="pt-2 text-neutral-500 italic text-[11px] space-y-1">
            {quote.observaciones && <p>Observaciones: {quote.observaciones}</p>}
            {quote.notas && <p>{quote.notas}</p>}
            {config.notasPiePersonalizadas && <p>{config.notasPiePersonalizadas}</p>}
          </div>
        )}
      </div>
    );
  };

  // Signatures Area
  const renderSignatures = () => {
    if (!config.mostrarFirmas) return null;

    return (
      <div className="pt-8 border-t border-neutral-200 grid grid-cols-2 gap-8 text-xs font-sans">
        <div>
          <p className="font-mono text-[10px] text-neutral-500 uppercase">Por el emisor:</p>
          <p className="font-semibold text-neutral-900 mt-1">{company.razonSocial}</p>
          <div className="h-14 border-b border-neutral-300 mt-2"></div>
        </div>
        <div>
          <p className="font-mono text-[10px] text-neutral-500 uppercase">Aceptado y Conforme:</p>
          <p className="font-semibold text-neutral-900 mt-1">
            {client?.empresa || client?.nombre || 'El Cliente'}
          </p>
          <div className="h-14 border-b border-neutral-300 mt-2"></div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={documentRef}
      id="quote-printable-doc"
      className={`border border-neutral-300 p-8 sm:p-14 bg-white rounded-sm shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 ${fontClass}`}
    >
      {config.modelo === 'ejecutivo' && renderEjecutivo()}
      {config.modelo === 'tecnico' && renderTecnico()}
      {config.modelo === 'editorial' && renderEditorial()}
      {config.modelo === 'minimalista' && renderMinimalista()}
    </div>
  );
};
