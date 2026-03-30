'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

let addToastFn: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function toast(type: ToastItem['type'], message: string) {
  addToastFn?.({ type, message });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastFn = (item) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { ...item, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  const icons = {
    success: <CheckCircle size={18} className="text-green-500" />,
    error: <XCircle size={18} className="text-red-500" />,
    info: <AlertCircle size={18} className="text-blue-500" />,
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border animate-fade-in min-w-[300px]"
        >
          {icons[t.type]}
          <p className="text-sm text-secondary-700 flex-1">{t.message}</p>
          <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
            <X size={14} className="text-secondary-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
