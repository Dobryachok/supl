import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { StatusTone } from '@/lib/format';

const tones: Record<StatusTone, string> = {
  neutral: 'bg-ink-100 text-ink-600 border-ink-200',
  info: 'bg-brand-50 text-brand-700 border-brand-100',
  progress: 'bg-frost-50 text-frost-500 border-frost-50',
  success: 'bg-success-50 text-success-700 border-success-100',
  warn: 'bg-warn-50 text-warn-600 border-warn-100',
  danger: 'bg-danger-50 text-danger-600 border-danger-100',
};

export interface BadgeProps {
  tone?: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ tone = 'neutral', icon, children, className, size = 'md' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Chip({
  children,
  onRemove,
  className,
}: {
  children: ReactNode;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-[13px] text-ink-700',
        className,
      )}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="-mr-1 flex size-4 cursor-pointer items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Убрать фильтр"
        >
          ×
        </button>
      )}
    </span>
  );
}

export function Dot({ tone = 'neutral' }: { tone?: StatusTone }) {
  const colors: Record<StatusTone, string> = {
    neutral: 'bg-ink-400',
    info: 'bg-brand-500',
    progress: 'bg-frost-500',
    success: 'bg-success-500',
    warn: 'bg-warn-500',
    danger: 'bg-danger-500',
  };
  return <span className={cn('inline-block size-2 rounded-full', colors[tone])} />;
}
