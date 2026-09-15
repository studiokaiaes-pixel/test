import React, { useEffect } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export interface ToastInfo {
  type: 'loading' | 'success' | 'error';
  message: string;
}

interface NotificationToastProps {
  toast: ToastInfo | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast || toast.type === 'loading') return;
    const timer = setTimeout(() => {
      onClose();
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-150">
      <div className="bg-neutral-900 text-white border border-neutral-800 px-4 py-2.5 rounded-sm shadow-lg flex items-center gap-3 text-xs tracking-wide">
        {toast.type === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-300" />}
        {toast.type === 'success' && <Check className="w-3.5 h-3.5 text-neutral-200" />}
        {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-neutral-300" />}
        <span className="font-medium">{toast.message}</span>
      </div>
    </div>
  );
};
