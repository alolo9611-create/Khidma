import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

interface Toast { id: number; text: string; error?: boolean }
const ToastContext = createContext<(text: string, opts?: { error?: boolean }) => void>(() => {});

/** Low-stakes success messages, bottom-left, about 4 s (HANDOFF §4). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string, opts: { error?: boolean } = {}) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, error: opts.error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="k-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div className="k-toast" key={t.id}><Icon name={t.error ? 'alertCircle' : 'check'} style={t.error ? { color: '#F4A39A' } : undefined} /><span>{t.text}</span></div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
