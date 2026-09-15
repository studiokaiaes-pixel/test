import React from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Receipt,
  TrendingUp,
  DollarSign,
  FileBox,
  Building2,
  Package,
  Landmark,
  Settings,
  Globe,
  Server,
  Briefcase,
  UserCheck,
  X,
} from 'lucide-react';
import { ViewMode } from '../../types';
import { storageService } from '../../services/storage';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const db = storageService.getDatabase();
  const currentUser = storageService.getCurrentUser();
  const isClientRole = currentUser?.isClient ?? false;

  const sections: NavSection[] = isClientRole
    ? [
        {
          items: [
            { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
          ],
        },
        {
          title: 'MIS SERVICIOS & PROYECTOS',
          items: [
            { id: 'services', label: 'Mis Servicios', icon: Briefcase, badgeCount: (db.services || []).length },
            { id: 'domains', label: 'Mis Dominios', icon: Globe, badgeCount: (db.domains || []).length },
            { id: 'hosting', label: 'Mi Hosting', icon: Server, badgeCount: (db.hosting || []).length },
            { id: 'projects', label: 'Mis Proyectos', icon: FolderKanban, badgeCount: db.projects.length },
          ],
        },
        {
          title: 'DOCUMENTACIÓN',
          items: [
            { id: 'quotes', label: 'Presupuestos', icon: FileText, badgeCount: db.quotes.length },
            { id: 'invoices', label: 'Facturas', icon: Receipt, badgeCount: db.invoices.length },
            { id: 'documents', label: 'Documentos', icon: FileBox, badgeCount: db.documents.length },
          ],
        },
      ]
    : [
        {
          items: [
            { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
          ],
        },
        {
          title: 'GESTIÓN',
          items: [
            { id: 'clients', label: 'Clientes', icon: Users, badgeCount: db.clients.length },
            { id: 'services', label: 'Servicios', icon: Briefcase, badgeCount: (db.services || []).length },
            { id: 'domains', label: 'Dominios', icon: Globe, badgeCount: (db.domains || []).length },
            { id: 'hosting', label: 'Hosting', icon: Server, badgeCount: (db.hosting || []).length },
            { id: 'projects', label: 'Proyectos', icon: FolderKanban, badgeCount: db.projects.filter((p) => p.estado !== 'Finalizado' && p.estado !== 'Cancelado').length },
          ],
        },
        {
          title: 'COMERCIAL',
          items: [
            { id: 'quotes', label: 'Presupuestos', icon: FileText, badgeCount: db.quotes.filter((q) => q.estado === 'Enviado' || q.estado === 'Borrador').length },
            { id: 'invoices', label: 'Facturas', icon: Receipt, badgeCount: db.invoices.filter((i) => i.estado === 'Emitida' || i.estado === 'Parcial').length },
            { id: 'commercial', label: 'Comercial', icon: TrendingUp, badgeCount: db.leads.filter((l) => l.estado !== 'Ganado' && l.estado !== 'Perdido').length },
          ],
        },
        {
          title: 'FINANZAS',
          items: [
            { id: 'finances', label: 'Finanzas', icon: DollarSign },
          ],
        },
        {
          title: 'DOCUMENTOS',
          items: [
            { id: 'documents', label: 'Documentos', icon: FileBox, badgeCount: db.documents.length },
          ],
        },
        {
          title: 'EMPRESA',
          items: [
            { id: 'suppliers', label: 'Proveedores', icon: Building2, badgeCount: db.suppliers.length },
            { id: 'products', label: 'Productos', icon: Package, badgeCount: db.products.filter((p) => (p.stock ?? 0) <= (p.stockMinimo ?? 0)).length },
            { id: 'company', label: 'Empresa', icon: Landmark },
          ],
        },
        {
          title: 'SISTEMA',
          items: [
            { id: 'users', label: 'Usuarios WP', icon: UserCheck },
            { id: 'settings', label: 'Configuración', icon: Settings },
          ],
        },
      ];

  const isItemActive = (id: ViewMode) => {
    if (currentView === id) return true;
    if (id === 'clients' && currentView.startsWith('client-')) return true;
    if (id === 'projects' && currentView.startsWith('project-')) return true;
    if (id === 'quotes' && currentView.startsWith('quote-')) return true;
    if (id === 'invoices' && currentView.startsWith('invoice-')) return true;
    if (id === 'finances' && currentView.startsWith('finance-')) return true;
    if (id === 'documents' && currentView.startsWith('document-')) return true;
    if (id === 'commercial' && currentView.startsWith('commercial-')) return true;
    if (id === 'suppliers' && currentView.startsWith('supplier-')) return true;
    if (id === 'products' && currentView.startsWith('product-')) return true;
    return false;
  };

  const content = (
    <div className="flex flex-col h-full select-none">
      {/* Mobile Close Button */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-200">
        <span className="font-mono font-bold tracking-wider text-sm">KAIA MENÚ</span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1 text-neutral-500 hover:text-neutral-900 rounded-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <div className="px-2.5 pb-1.5 text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs font-medium tracking-tight transition-colors cursor-pointer text-left ${
                      active
                        ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-neutral-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-xs ${
                          active
                            ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Footer info */}
      <div
        onClick={() => onNavigate('settings')}
        className="p-3 border-t border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/80 transition-colors cursor-pointer"
        title="Configuración de WordPress & KAIA"
      >
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
          <span className="font-semibold text-neutral-800">KAIA WORDPRESS</span>
          <span className="flex items-center gap-1 text-neutral-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            PLUGIN API
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-neutral-200 bg-white shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 h-full bg-white shadow-2xl animate-in slide-in-from-left duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
