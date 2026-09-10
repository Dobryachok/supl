import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { uid } from '@/lib/ids';

type ToastTone = 'success' | 'info' | 'error';

interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  text?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  show: (toast: Omit<ToastItem, 'id'>) => void;
  success: (title: string, text?: string) => void;
  info: (title: string, text?: string) => void;
  error: (title: string, text?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const icons: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-5 text-success-500" />,
  info: <Info className="size-5 text-brand-500" />,
  error: <AlertTriangle className="size-5 text-brand-500" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = uid('toast');
      setItems((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, text) => show({ tone: 'success', title, text }),
      info: (title, text) => show({ tone: 'info', title, text }),
      error: (title, text) => show({ tone: 'error', title, text }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'animate-slide-up pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-[var(--shadow-pop)]',
              item.tone === 'error' ? 'border-brand-100' : 'border-ink-200',
            )}
          >
            {icons[item.tone]}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{item.title}</p>
              {item.text && <p className="mt-0.5 text-[13px] text-ink-600">{item.text}</p>}
              {item.action && (
                <button
                  type="button"
                  onClick={() => {
                    item.action?.onClick();
                    remove(item.id);
                  }}
                  className="mt-1.5 cursor-pointer text-[13px] font-medium text-brand-600 hover:underline"
                >
                  {item.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="cursor-pointer text-ink-400 hover:text-ink-700"
              aria-label="Закрыть уведомление"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast вызван вне ToastProvider');
  return ctx;
}
