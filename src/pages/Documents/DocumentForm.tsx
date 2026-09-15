import React, { useState, useRef } from 'react';
import { Upload, FileText, Check } from 'lucide-react';
import { storageService } from '../../services/storage';
import { DocumentItem, ViewMode } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { getTodayISO } from '../../utils/formatters';

interface DocumentFormProps {
  onNavigate: (view: ViewMode, id?: string) => void;
  onShowToast: (type: 'loading' | 'success' | 'error', message: string) => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ onNavigate, onShowToast }) => {
  const db = storageService.getDatabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Contratos');
  const [tipo, setTipo] = useState('PDF');
  const [tamano, setTamano] = useState('1.2 MB');
  const [clienteId, setClienteId] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [notas, setNotas] = useState('');
  const [fileSelected, setFileSelected] = useState<string | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    setFileSelected(file.name);
    if (!nombre) {
      setNombre(file.name);
    }
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    setTipo(ext);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setTamano(file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFileDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      onShowToast('error', 'Indica el nombre del documento.');
      return;
    }

    onShowToast('loading', 'Guardando documento...');

    const newDoc: DocumentItem = {
      id: `DOC-${Date.now().toString().slice(-4)}`,
      nombre: nombre.trim(),
      categoria,
      tipo,
      tamano,
      fechaSubida: getTodayISO(),
      clienteId: clienteId || undefined,
      proyectoId: proyectoId || undefined,
      notas,
      url: fileDataUrl,
    };

    storageService.saveDocument(newDoc);
    onShowToast('success', 'Documento guardado en el repositorio.');
    onNavigate('documents');
  };

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-100">
      <div className="flex items-center justify-between">
        <BackButton label="Volver a documentos" onClick={() => onNavigate('documents')} />
        <div className="text-xs font-mono text-neutral-400">Repositorio KAIA</div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm shadow-xs overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Añadir Documento</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Sube o registra archivos legales, contratos o documentación técnica vinculada.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Drag & Drop File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-8 border-2 border-dashed rounded-sm text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-neutral-900 bg-neutral-100 ring-2 ring-neutral-950/10'
                : 'border-neutral-300 hover:border-neutral-900 bg-neutral-50 hover:bg-neutral-100'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className={`w-8 h-8 mx-auto mb-2 transition-transform ${isDragging ? 'scale-110 text-neutral-900' : 'text-neutral-400'}`} />
            <div className="text-xs font-semibold text-neutral-900">
              {fileSelected ? fileSelected : 'Haz clic para seleccionar o arrastra un archivo aquí'}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 font-mono">
              Formatos admitidos: PDF, DOCX, XLSX, ZIP, PNG (hasta 25 MB)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Nombre del Documento *
              </label>
              <input
                type="text"
                value={nombre ?? ''}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Contrato de confidencialidad NDA firmado"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Categoría</label>
              <select
                value={categoria ?? 'Contratos'}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm focus:outline-hidden cursor-pointer"
              >
                <option value="Contratos">Contratos</option>
                <option value="Propuestas">Propuestas</option>
                <option value="Facturas">Facturas</option>
                <option value="Plantillas">Plantillas</option>
                <option value="Documentos de clientes">Documentos de clientes</option>
                <option value="Documentos de proyectos">Documentos de proyectos</option>
                <option value="Archivos subidos">Archivos subidos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">Formato / Tipo</label>
              <input
                type="text"
                value={tipo ?? 'PDF'}
                onChange={(e) => setTipo(e.target.value)}
                placeholder="PDF / DOCX"
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Asociar a Cliente (Opcional)
              </label>
              <select
                value={clienteId ?? ''}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm cursor-pointer"
              >
                <option value="">Sin cliente asociado</option>
                {db.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.empresa || `${c.nombre} ${c.apellidos}`} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Asociar a Proyecto (Opcional)
              </label>
              <select
                value={proyectoId ?? ''}
                onChange={(e) => setProyectoId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm cursor-pointer"
              >
                <option value="">Sin proyecto asociado</option>
                {db.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-800 mb-1">Notas Internas</label>
              <textarea
                rows={2}
                value={notas ?? ''}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Detalles sobre versiones, firmantes o vigencia..."
                className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-sm"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-sm cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-950 hover:bg-neutral-800 rounded-sm cursor-pointer transition-colors shadow-xs"
            >
              Guardar Documento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
