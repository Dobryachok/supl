import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onClose]);
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  children,
}: ModalProps) {
  useBodyLock(open);
  useEscape(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/45 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'animate-slide-up relative my-auto w-full rounded-xl bg-white shadow-[var(--shadow-pop)]',
          modalSizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4">
          <div>
            {title && <h3 className="text-base">{title}</h3>}
            {description && <p className="mt-1 text-[13px] text-ink-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mt-1 -mr-1 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>
        {children != null && (
          <div className="scroll-thin max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        )}
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-ink-200 bg-ink-50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: 'right' | 'left';
  width?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  width = 'w-[min(420px,92vw)]',
  footer,
  children,
}: DrawerProps) {
  useBodyLock(open);
  useEscape(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-ink-900/45">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        className={cn(
          'relative flex h-full flex-col bg-white shadow-[var(--shadow-pop)]',
          width,
          side === 'right' ? 'ml-auto' : 'mr-auto',
        )}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
          <h3 className="text-[15px]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="border-t border-ink-200 bg-ink-50 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
