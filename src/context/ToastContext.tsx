import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-[24px] right-[16px] left-[16px] sm:left-auto sm:right-[24px] sm:w-[400px] z-[120] flex flex-col items-center sm:items-end gap-[12px] pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center justify-between min-w-[280px] max-w-[380px] p-[16px] rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border transition-all duration-300
              ${toast.type === 'success' ? 'bg-[#FDFCFB] border-[#EBE7E0] text-carbon dark:bg-[#1A1A1A] dark:border-[#333333] dark:text-[#F4F1ED]' : ''}
              ${toast.type === 'error' ? 'bg-[#FFF5F5] border-[#FED7D7] text-[#C53030] dark:bg-[#2D1A1A] dark:border-[#4A2424] dark:text-[#FC8181]' : ''}
              ${toast.type === 'warning' ? 'bg-[#FFFAF0] border-[#FEEBC8] text-[#C05621] dark:bg-[#2D241A] dark:border-[#4A3924] dark:text-[#F6AD55]' : ''}
              ${toast.type === 'info' ? 'bg-[#EBF8FF] border-[#BEE3F8] text-[#2B6CB0] dark:bg-[#1A2633] dark:border-[#243B52] dark:text-[#63B3ED]' : ''}
            `}
          >
            <div className="flex items-center gap-[12px]">
              {toast.type === 'success' && <CheckCircle2 className="w-[20px] h-[20px] text-[#2E7D32] dark:text-[#4CAF50]" />}
              {toast.type === 'error' && <XCircle className="w-[20px] h-[20px] text-[#C53030] dark:text-[#FC8181]" />}
              {toast.type === 'warning' && <AlertCircle className="w-[20px] h-[20px] text-[#C05621] dark:text-[#F6AD55]" />}
              {toast.type === 'info' && <Info className="w-[20px] h-[20px] text-[#2B6CB0] dark:text-[#63B3ED]" />}
              <span className="text-[14px] font-medium leading-tight">{toast.message}</span>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="ml-[12px] p-[4px] opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-[14px] h-[14px]" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
