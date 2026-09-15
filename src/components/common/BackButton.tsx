import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  onClick: () => void;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Volver',
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-600 hover:text-neutral-950 font-medium transition-colors py-1 px-2 rounded-sm border border-neutral-200 hover:border-neutral-900 bg-white shadow-xs cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
      <span>{label}</span>
    </button>
  );
};
