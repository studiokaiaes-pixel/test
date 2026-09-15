import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  actionLabel,
  onAction,
  description,
}) => {
  return (
    <div className="py-16 px-6 text-center border border-dashed border-neutral-300 rounded-sm bg-neutral-50/50 flex flex-col items-center justify-center">
      <p className="text-base font-medium text-neutral-800 tracking-tight">{message}</p>
      {description && (
        <p className="text-sm text-neutral-500 mt-1 max-w-md">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
