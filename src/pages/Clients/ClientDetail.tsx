import React, { useState } from 'react';
import {
  Edit,
  Plus,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  FolderKanban,
  Receipt,
  File,
  History,
  ArrowRight,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { ViewMode } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { formatDateES, formatCurrency } from '../../utils/formatters';

interface ClientDetailProps {
  clientId: string;
  onNavigate: (view: ViewMode, id?: string) => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ clientId, onNavigate }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'proyectos' | 'presupuestos' | 'facturas' | 'documentos' | 'historial'>('proyectos');

  const db = storageService.getDatabase();
  const client = db.clients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <div className="space-y-6">
        <BackButton label="Volver a clientes" onClick={() => onNavigate('clients')} />
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-sm">
          <p className="text-neutral-600">Cliente no encontrado en la base de datos.</p>
        </div>
      </div>
    );
  }

  // Related data
  const projects = db.projects.filter((p) => p.clienteId === client.id);
  const quotes = db.quotes.filter((q) => q.clienteId === client.id);
  const invoices = db.invoices.filter((i) => i.clienteId === client.id);
  const documents = db.documents.filter((d) => d.clienteId === client.id);
  const clientActivities = db.activities.filter(
    (a) =>
      a.entidadId === client.id ||
      projects.some((p) => p.id === a.entidadId) ||
      quotes.some((q) => q.id === a.entidadId) ||
      invoices.some((i) => i.id === a.entidadId)
  );

  const handleDelete = () => {
    storageService.deleteClient(client.id);
    onNavigate('clients');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Volver a clientes" onClick={() => onNavigate('clients')} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('client-edit', client.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-800 bg-white border border-neutral-300 hover:border-neutral-900 rounded-sm cursor-pointer transition-colors shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Editar cliente</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 bg-white border border-neutral-200 hover:border-neutral-900 rounded-sm cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* Main Client Info Card */}
      <div className="bg-white border border-neutral-200 rounded-sm p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-500 font-semibold">{client.id}</span>
              <StatusBadge status={client.estado} />
              {client.isDemo && (
                <span className="text-[10px] font-mono border border-neutral-300 px-1.5 py-0.5 rounded text-neutral-400">
                  DEMO
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-neutral-950 mt-1.5">
              {client.empresa || `${client.nombre} ${client.apellidos}`}
            </h1>
            {client.empresa && (
              <p className="text-sm text-neutral-600 mt-0.5">
                Contacto: {client.nombre} {client.apellidos}
              </p>
            )}
          </div>

          {/* Direct Creation Actions for this specific client */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('project-new')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-800 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-sm cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Nuevo proyecto</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('quote-builder')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-800 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-sm cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Nuevo presupuesto</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('invoice-builder')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-800 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-sm cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Nueva factura</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('document-new')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-800 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-sm cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir documento</span>
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">NIF / CIF</span>
            <span className="font-mono font-medium text-neutral-900">{client.cif || '—'}</span>
          </div>
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Email</span>
            <span className="font-mono text-neutral-900">{client.email || '—'}</span>
          </div>
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Teléfono</span>
            <span className="font-mono text-neutral-900">{client.telefono || '—'}</span>
          </div>
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Fecha de Alta</span>
            <span className="font-mono text-neutral-900">{formatDateES(client.fechaAlta)}</span>
          </div>
        </div>

        {/* Address and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Dirección Fiscal / Postal</span>
            <p className="text-neutral-800">
              {client.direccion ? `${client.direccion}, ` : ''}
              {client.codigoPostal ? `${client.codigoPostal} ` : ''}
              {client.ciudad ? `${client.ciudad}, ` : ''}
              {client.provincia ? `${client.provincia} ` : ''}
              {client.pais ? `(${client.pais})` : ''}
              {!client.direccion && !client.ciudad && 'Sin dirección especificada'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Notas Internas</span>
            <p className="text-neutral-700 italic">{client.notas || 'Sin notas adicionales.'}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation for Relations: PROYECTOS, PRESUPUESTOS, FACTURAS, DOCUMENTOS, HISTORIAL */}
      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        <div className="flex border-b border-neutral-200 bg-neutral-50/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('proyectos')}
            className={`px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'proyectos'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            PROYECTOS ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presupuestos')}
            className={`px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'presupuestos'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            PRESUPUESTOS ({quotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('facturas')}
            className={`px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'facturas'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            FACTURAS ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'documentos'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            DOCUMENTOS ({documents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'historial'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            HISTORIAL ({clientActivities.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* PROYECTOS */}
          {activeTab === 'proyectos' && (
            <div>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-500">
                  Sin proyectos registrados para este cliente.{' '}
                  <button
                    onClick={() => onNavigate('project-new')}
                    className="text-neutral-950 font-semibold underline cursor-pointer"
                  >
                    Crear primer proyecto
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onNavigate('project-detail', p.id)}
                      className="py-3 flex items-center justify-between hover:bg-neutral-50 px-2 rounded-sm cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-neutral-500">{p.id}</span>
                          <span className="font-semibold text-xs text-neutral-900">{p.titulo}</span>
                          <StatusBadge status={p.estado} />
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-1">
                          Servicio: {p.servicio} · Importe: {formatCurrency(p.importe)} · Inicio: {formatDateES(p.fechaInicio)}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRESUPUESTOS */}
          {activeTab === 'presupuestos' && (
            <div>
              {quotes.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-500">
                  Sin presupuestos emitidos a este cliente.{' '}
                  <button
                    onClick={() => onNavigate('quote-builder')}
                    className="text-neutral-950 font-semibold underline cursor-pointer"
                  >
                    Generar presupuesto
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => onNavigate('quote-detail', q.id)}
                      className="py-3 flex items-center justify-between hover:bg-neutral-50 px-2 rounded-sm cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-neutral-900">{q.id}</span>
                          <StatusBadge status={q.estado} />
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-1">
                          Fecha: {formatDateES(q.fecha)} · Validez: {formatDateES(q.validez)} · Total:{' '}
                          <span className="font-mono font-bold text-neutral-900">{formatCurrency(q.total)}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FACTURAS */}
          {activeTab === 'facturas' && (
            <div>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-500">
                  Sin facturas emitidas a este cliente.{' '}
                  <button
                    onClick={() => onNavigate('invoice-builder')}
                    className="text-neutral-950 font-semibold underline cursor-pointer"
                  >
                    Crear factura
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => onNavigate('invoice-detail', inv.id)}
                      className="py-3 flex items-center justify-between hover:bg-neutral-50 px-2 rounded-sm cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-neutral-900">{inv.id}</span>
                          <StatusBadge status={inv.estado} />
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-1">
                          Emisión: {formatDateES(inv.fechaEmision)} · Vto: {formatDateES(inv.fechaVencimiento)} · Total:{' '}
                          <span className="font-mono font-bold text-neutral-900">{formatCurrency(inv.total)}</span> ·
                          Pendiente:{' '}
                          <span className="font-mono font-bold text-neutral-700">{formatCurrency(inv.importePendiente)}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-900" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-500">
                  Sin documentos asociados a este cliente.{' '}
                  <button
                    onClick={() => onNavigate('document-new')}
                    className="text-neutral-950 font-semibold underline cursor-pointer"
                  >
                    Subir documento
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {documents.map((d) => (
                    <div
                      key={d.id}
                      className="py-3 flex items-center justify-between hover:bg-neutral-50 px-2 rounded-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <File className="w-4 h-4 text-neutral-400" />
                        <div>
                          <div className="text-xs font-semibold text-neutral-900">{d.nombre}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {d.tamano} · Subido el {formatDateES(d.fechaSubida)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate('documents')}
                        className="text-xs font-mono text-neutral-600 hover:text-neutral-950 underline"
                      >
                        Ver en gestor
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORIAL */}
          {activeTab === 'historial' && (
            <div>
              {clientActivities.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-500">
                  Sin eventos históricos para este cliente todavía.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {clientActivities.map((act) => (
                    <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-neutral-900">{act.descripcion}</span>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{act.fecha}</div>
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                        {act.tipo}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar cliente"
        message={`¿Estás seguro de que deseas eliminar a "${client.empresa || client.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
