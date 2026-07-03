import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, AlertTriangle, Loader2, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

type ToastOptions = { description?: string; duration?: number; action?: { label: string; onClick: () => void } };

class ToastObserver {
  private subscribers: ((toast: ToastMessage | { id: string, dismiss: true }) => void)[] = [];
  private count = 0;

  subscribe(callback: (toast: ToastMessage | { id: string, dismiss: true }) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notify(toast: ToastMessage | { id: string, dismiss: true }) {
    this.subscribers.forEach((cb) => cb(toast));
  }

  add(type: ToastType, message: string, options?: ToastOptions) {
    const id = `toast-${++this.count}`;
    this.notify({ id, type, message, ...options });
    return id;
  }

  dismiss(id: string) {
    this.notify({ id, dismiss: true });
  }

  success(message: string, options?: ToastOptions) { return this.add('success', message, options); }
  error(message: string, options?: ToastOptions) { return this.add('error', message, options); }
  info(message: string, options?: ToastOptions) { return this.add('info', message, options); }
  warning(message: string, options?: ToastOptions) { return this.add('warning', message, options); }
  loading(message: string, options?: ToastOptions) { return this.add('loading', message, options); }
}

export const toastObserver = new ToastObserver();

// Also assign the function signature to the object
const toastFn = Object.assign(
  (message: string, options?: ToastOptions) => toastObserver.info(message, options),
  {
    success: toastObserver.success.bind(toastObserver),
    error: toastObserver.error.bind(toastObserver),
    info: toastObserver.info.bind(toastObserver),
    warning: toastObserver.warning.bind(toastObserver),
    loading: toastObserver.loading.bind(toastObserver),
    dismiss: toastObserver.dismiss.bind(toastObserver),
    subscribe: toastObserver.subscribe.bind(toastObserver),
  }
);

export { toastFn as toast };

export const ToastProvider: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toastObserver.subscribe((t) => {
      if ('dismiss' in t) {
        setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
      } else {
        setToasts((prev) => [...prev, t as ToastMessage]);
        if (t.type !== 'loading' && t.duration !== Infinity) {
          setTimeout(() => {
            toastObserver.dismiss(t.id);
          }, t.duration || 4000);
        }
      }
    });
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => toastObserver.dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
    warning: <AlertTriangle className="text-amber-500" size={20} />,
    loading: <Loader2 className="text-indigo-500 animate-spin" size={20} />,
  };

  const bgColors = {
    success: 'bg-white border-emerald-100',
    error: 'bg-white border-red-100',
    info: 'bg-white border-blue-100',
    warning: 'bg-white border-amber-100',
    loading: 'bg-white border-indigo-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border ${bgColors[toast.type]} min-w-[300px] max-w-md`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800">{toast.message}</p>
        {toast.description && <p className="text-xs text-slate-500 mt-1">{toast.description}</p>}
        {toast.action && (
          <button 
            onClick={() => {
              toast.action!.onClick();
              onDismiss();
            }}
            className="mt-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      {toast.type !== 'loading' && (
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={16} />
        </button>
      )}
    </motion.div>
  );
};
