import React from 'react';
import { NotificationToast } from '../types/airQuality';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: NotificationToast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 border border-amber-500/80 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-200"
          >
            <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 mt-0.5 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-white truncate">{toast.title}</h4>
                <button
                  onClick={() => onDismiss(toast.id)}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
              <div className="text-[10px] text-slate-400 font-mono mt-2">
                {toast.timestamp}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
