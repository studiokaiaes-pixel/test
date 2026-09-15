import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, FolderKanban, FileText, Receipt, File, Building2, Package, ArrowRight } from 'lucide-react';
import { storageService } from '../../services/storage';
import { ViewMode } from '../../types';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewMode, id?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const db = storageService.getDatabase();
  const q = query.trim().toLowerCase();

  const clients = q
    ? db.clients.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.empresa.toLowerCase().includes(q) ||
          c.nombre.toLowerCase().includes(q) ||
          c.apellidos.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.cif.toLowerCase().includes(q)
      )
    : [];

  const projects = q
    ? db.projects.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.titulo.toLowerCase().includes(q) ||
          p.servicio.toLowerCase().includes(q)
      )
    : [];

  const quotes = q
    ? db.quotes.filter(
        (qItem) =>
          qItem.id.toLowerCase().includes(q) ||
          qItem.clienteId.toLowerCase().includes(q) ||
          qItem.estado.toLowerCase().includes(q)
      )
    : [];

  const invoices = q
    ? db.invoices.filter(
        (inv) =>
          inv.id.toLowerCase().includes(q) ||
          inv.clienteId.toLowerCase().includes(q) ||
          inv.estado.toLowerCase().includes(q)
      )
    : [];

  const documents = q
    ? db.documents.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.nombre.toLowerCase().includes(q) ||
          d.categoria.toLowerCase().includes(q)
      )
    : [];

  const suppliers = q
    ? db.suppliers.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          (s.empresa || s.proveedor || '').toLowerCase().includes(q) ||
          s.servicio.toLowerCase().includes(q) ||
          s.cif.toLowerCase().includes(q)
      )
    : [];

  const products = q
    ? db.products.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          (p.referencia || p.codigo || '').toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q)
      )
    : [];

  const hasResults =
    clients.length > 0 ||
    projects.length > 0 ||
    quotes.length > 0 ||
    invoices.length > 0 ||
    documents.length > 0 ||
    suppliers.length > 0 ||
    products.length > 0;

  const handleSelect = (view: ViewMode, id?: string) => {
    onNavigate(view, id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-neutral-300 w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-100">
        <div className="p-3 border-b border-neutral-200 flex items-center gap-3 bg-neutral-50/70">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query ?? ''}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, CIF, proyecto, presupuesto, factura, producto..."
            className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden"
          />
          <span className="text-[10px] font-mono border border-neutral-300 px-1.5 py-0.5 rounded text-neutral-400">
            ESC
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-5 divide-y divide-neutral-100">
          {!q && (
            <div className="text-center py-10 text-neutral-400 text-xs tracking-wider uppercase">
              Introduce un término para realizar una búsqueda global en KAIA
            </div>
          )}

          {q && !hasResults && (
            <div className="text-center py-10 text-neutral-500 text-sm">
              No se han encontrado resultados para <span className="font-semibold text-neutral-900">"{query}"</span>
            </div>
          )}

          {/* Clientes */}
          {clients.length > 0 && (
            <div className="pt-3 first:pt-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Clientes ({clients.length})</span>
              </div>
              <div className="space-y-1">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect('client-detail', c.id)}
                    className="w-full text-left px-3 py-2 rounded-sm hover:bg-neutral-100 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">
                        {c.empresa || `${c.nombre} ${c.apellidos}`}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {c.id} · CIF: {c.cif} · {c.email}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Proyectos */}
          {projects.length > 0 && (
            <div className="pt-3 first:pt-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Proyectos ({projects.length})</span>
              </div>
              <div className="space-y-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect('project-detail', p.id)}
                    className="w-full text-left px-3 py-2 rounded-sm hover:bg-neutral-100 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">{p.titulo}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {p.id} · Estado: {p.estado} · {p.servicio}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Presupuestos */}
          {quotes.length > 0 && (
            <div className="pt-3 first:pt-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Presupuestos ({quotes.length})</span>
              </div>
              <div className="space-y-1">
                {quotes.map((qItem) => (
                  <button
                    key={qItem.id}
                    onClick={() => handleSelect('quote-detail', qItem.id)}
                    className="w-full text-left px-3 py-2 rounded-sm hover:bg-neutral-100 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 font-mono">
                        {qItem.id} · {qItem.total.toFixed(2)} €
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Cliente: {qItem.clienteId} · Estado: {qItem.estado}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Facturas */}
          {invoices.length > 0 && (
            <div className="pt-3 first:pt-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                <Receipt className="w-3.5 h-3.5" />
                <span>Facturas ({invoices.length})</span>
              </div>
              <div className="space-y-1">
                {invoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => handleSelect('invoice-detail', inv.id)}
                    className="w-full text-left px-3 py-2 rounded-sm hover:bg-neutral-100 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 font-mono">
                        {inv.id} · {inv.total.toFixed(2)} €
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Cliente: {inv.clienteId} · Estado: {inv.estado} · Pendiente: {inv.importePendiente.toFixed(2)} €
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Productos */}
          {products.length > 0 && (
            <div className="pt-3 first:pt-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                <Package className="w-3.5 h-3.5" />
                <span>Productos ({products.length})</span>
              </div>
              <div className="space-y-1">
                {products.map((prd) => (
                  <button
                    key={prd.id}
                    onClick={() => handleSelect('product-detail', prd.id)}
                    className="w-full text-left px-3 py-2 rounded-sm hover:bg-neutral-100 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">{prd.nombre}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {prd.id} · Ref: {prd.referencia || prd.codigo || prd.id} · {prd.categoria}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Proveedores */}
          {suppliers.length > 0 && (
            <div className="pt-3 first:pt-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Proveedores ({suppliers.length})</span>
              </div>
              <div className="space-y-1">
                {suppliers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect('supplier-detail', s.id)}
                    className="w-full text-left px-3 py-2 rounded-sm hover:bg-neutral-100 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">{s.empresa || s.proveedor}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {s.id} · CIF: {s.cif} · {s.servicio}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Documentos */}
          {documents.length > 0 && (
            <div className="pt-3 first:pt-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                <File className="w-3.5 h-3.5" />
                <span>Documentos ({documents.length})</span>
              </div>
              <div className="space-y-1">
                {documents.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect('documents')}
                    className="w-full text-left px-3 py-2 rounded-sm hover:bg-neutral-100 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">{d.nombre}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {d.id} · {d.categoria} · {d.tamano}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
