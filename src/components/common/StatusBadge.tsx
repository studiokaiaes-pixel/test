import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'sm' }) => {
  const normalized = status.toLowerCase();

  // Monochrome & subtle tone hierarchy:
  // Success / Active -> solid dark or clean neutral with dark border
  // Pending / In progress -> subtle gray outline
  // Alert / Canceled / Rejected -> discreet dashed or dark muted
  let styleClasses = 'bg-neutral-100 text-neutral-800 border-neutral-300';

  if (
    normalized === 'activo' ||
    normalized === 'completado' ||
    normalized === 'finalizado' ||
    normalized === 'pagada' ||
    normalized === 'aceptado' ||
    normalized === 'ganado' ||
    normalized === 'disponible'
  ) {
    styleClasses = 'bg-neutral-900 text-white border-neutral-900 font-semibold';
  } else if (
    normalized === 'en curso' ||
    normalized === 'en preparación' ||
    normalized === 'enviado' ||
    normalized === 'parcial' ||
    normalized === 'reunión' ||
    normalized === 'presupuesto' ||
    normalized === 'negociación'
  ) {
    styleClasses = 'bg-neutral-200 text-neutral-900 border-neutral-400 font-medium';
  } else if (
    normalized === 'borrador' ||
    normalized === 'pendiente' ||
    normalized === 'nuevo' ||
    normalized === 'contactado' ||
    normalized === 'respuesta'
  ) {
    styleClasses = 'bg-white text-neutral-700 border-neutral-300';
  } else if (
    normalized === 'inactivo' ||
    normalized === 'cancelado' ||
    normalized === 'rechazado' ||
    normalized === 'vencida' ||
    normalized === 'perdido' ||
    normalized === 'agotado' ||
    normalized === 'descatalogado'
  ) {
    styleClasses = 'bg-neutral-100 text-neutral-500 border-neutral-200 line-through-none';
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm border font-mono tracking-tight uppercase ${paddingClass} ${styleClasses} ${className}`}
    >
      {status}
    </span>
  );
};
