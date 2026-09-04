import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs({ items, value, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={cn('no-scrollbar flex gap-1.5 overflow-x-auto', className)}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              value === item.id
                ? 'bg-brand-600 text-white'
                : 'bg-white text-ink-600 ring-1 ring-ink-200 ring-inset hover:text-ink-900',
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span className={cn(value === item.id ? 'text-white/75' : 'text-ink-400')}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('no-scrollbar flex gap-5 overflow-x-auto border-b border-ink-200', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            '-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 pb-2.5 text-sm font-medium transition-colors',
            value === item.id
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-ink-500 hover:text-ink-800',
          )}
        >
          {item.icon}
          {item.label}
          {item.count !== undefined && <span className="text-xs text-ink-400">{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
