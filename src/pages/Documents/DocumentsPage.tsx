import React, { useState } from 'react';
import {
  Plus,
  Search,
  File,
  FileText,
  Download,
  Trash2,
  Folder,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { DocumentItem, ViewMode } from '../../types';
import { formatDateES } from '../../utils/formatters';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { generateDocumentPDF } from '../../utils/pdfGenerator';

interface DocumentsPageProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const categories = [
    'Todos',
    'Contratos',
    'Propuestas',
    'Facturas',
    'Plantillas',
    'Documentos de clientes',
    'Documentos de proyectos',
    'Archivos subidos',
  ];

  const filteredDocs = db.documents.filter((d) => {
    if (activeCategory !== 'Todos' && d.categoria !== activeCategory) return false;
    const matches =
      d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    return matches;
  });

  const handleDelete = () => {
    if (deleteDocId) {
      storageService.deleteDocument(deleteDocId);
      setDeleteDocId(null);
      onShowToast('success', 'Documento eliminado.');
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    try {
      // 1. If real file URL or uploaded dataUrl exists, download directly
      if (doc.url && (doc.url.startsWith('data:') || doc.url.startsWith('blob:') || doc.url.startsWith('http'))) {
        const a = document.createElement('a');
        a.href = doc.url;
        a.download = doc.nombre;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onShowToast('success', `Descargando ${doc.nombre}...`);
        return;
      }

      // 2. If it's a PDF file (by tipo or .pdf extension), generate a genuine 100% valid PDF!
      if (doc.tipo.toUpperCase() === 'PDF' || doc.nombre.toLowerCase().endsWith('.pdf')) {
        const client = doc.clienteId ? db.clients.find((c) => c.id === doc.clienteId) : null;
        generateDocumentPDF(doc, client, db.company);
        onShowToast('success', `Descargando ${doc.nombre} (PDF Oficial)...`);
        return;
      }

      // 3. For any other document type without uploaded data
      const blob = new Blob([doc.notas || `Documento Oficial KAIA: ${doc.nombre}\nTipo: ${doc.tipo}\nCategoría: ${doc.categoria}`], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nombre;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast('success', `Descargando ${doc.nombre}...`);
    } catch (err) {
      console.error('Error generating document download:', err);
      onShowToast('error', 'No se pudo generar la descarga del documento.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Documentos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Gestor documental centralizado, contratos, expedientes y repositorio corporativo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('document-new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Añadir documento</span>
        </button>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 border border-neutral-200 rounded-sm shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar documentos por nombre o formato..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wider rounded-sm transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-neutral-950 text-white font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid / Table */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          message="Sin documentos en esta categoría."
          description="Sube o vincula contratos, acuerdos o especificaciones a clientes y proyectos."
          actionLabel="Añadir documento"
          onAction={() => onNavigate('document-new')}
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Tamaño</th>
                <th className="px-4 py-3">Asociado A</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredDocs.map((doc) => {
                const client = doc.clienteId ? db.clients.find((c) => c.id === doc.clienteId) : null;
                const project = doc.proyectoId ? db.projects.find((p) => p.id === doc.proyectoId) : null;

                return (
                  <tr key={doc.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                        <div>
                          <div className="font-semibold text-neutral-950">{doc.nombre}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{doc.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700 whitespace-nowrap font-medium">
                      {doc.categoria}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-500 text-[11px] uppercase">
                      {doc.tipo}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-500 text-[11px]">
                      {doc.tamano}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {client && (
                        <div className="text-[11px]">
                          <span className="text-neutral-400">Cliente:</span> {client.empresa || client.nombre}
                        </div>
                      )}
                      {project && (
                        <div className="text-[11px]">
                          <span className="text-neutral-400">Proyecto:</span> {project.titulo}
                        </div>
                      )}
                      {!client && !project && <span className="text-neutral-400">General KAIA</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-500 text-[11px]">
                      {formatDateES(doc.fechaSubida)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-sm cursor-pointer"
                          title="Descargar documento"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteDocId(doc.id)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-sm cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteDocId}
        title="Eliminar documento"
        message="¿Seguro que deseas eliminar este documento del repositorio?"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDocId(null)}
      />
    </div>
  );
};
