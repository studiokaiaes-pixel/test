import React from 'react';
import { Search, Settings as SettingsIcon, Menu } from 'lucide-react';
import { ViewMode } from '../../types';

interface HeaderProps {
  onOpenSearch: () => void;
  onNavigate: (view: ViewMode) => void;
  onToggleSidebar: () => void;
  isDark: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onNavigate,
  onToggleSidebar,
}) => {
  return (
    <header className="h-14 border-b border-neutral-200 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 text-neutral-600 hover:text-neutral-950 rounded-sm hover:bg-neutral-100 cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-baseline gap-2 text-left cursor-pointer group"
        >
          <span className="font-bold tracking-widest text-lg text-neutral-950 font-mono">
            KAIA
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
            Business Management System
          </span>
        </button>
      </div>

      {/* Right Actions: Estado: LOCAL, Buscar, Configuración */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Estado: LOCAL */}
        <div className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded-sm">
          <span className="text-[10px] uppercase font-mono text-neutral-500">Estado:</span>
          <span className="text-[11px] font-mono font-bold tracking-wide text-neutral-900 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 inline-block"></span>
            LOCAL
          </span>
        </div>

        {/* Global Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-950 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
          title="Buscar globalmente (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Buscar</span>
          <kbd className="hidden lg:inline text-[9px] font-mono bg-white border border-neutral-300 px-1 py-0.5 rounded text-neutral-400">
            Ctrl K
          </kbd>
        </button>

        {/* Configuración */}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 bg-white hover:bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Configuración</span>
        </button>
      </div>
    </header>
  );
};
