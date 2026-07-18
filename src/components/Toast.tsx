import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, ShoppingBag, CheckCircle, Rocket } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'xp';
  title?: string;
}

interface ToastContextData {
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextData>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`pointer-events-auto flex items-start gap-4 p-4 min-w-[300px] border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] relative overflow-hidden
                ${toast.type === 'xp' ? 'bg-purple-100 text-purple-900' : 
                  toast.type === 'success' ? 'bg-green-100 text-green-900' :
                  toast.type === 'info' ? 'bg-blue-100 text-blue-900' : 'bg-yellow-100 text-yellow-900'}
              `}
            >
              {/* Glossy Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/40 pointer-events-none" />
              
              <div className="flex-shrink-0 mt-1 relative z-10">
                {toast.type === 'xp' && <Trophy className="text-purple-600" />}
                {toast.type === 'success' && <CheckCircle className="text-green-600" />}
                {toast.type === 'info' && <Rocket className="text-blue-600" />}
                {toast.type === 'warning' && <ShoppingBag className="text-yellow-600" />}
              </div>
              
              <div className="flex-grow pr-6 relative z-10">
                {toast.title && <h4 className="font-display font-bold uppercase tracking-wide text-sm mb-1">{toast.title}</h4>}
                <p className="font-bold text-sm leading-tight opacity-90">{toast.message}</p>
              </div>

              <button 
                onClick={() => removeToast(toast.id)}
                className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded-full transition-colors z-10"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
