import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export function MultiSelect({
  prefix,
  placeholder,
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  prefix?: string;
  placeholder: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  };

  const summary =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? options.find((option) => option.value === value[0])?.label ?? placeholder
        : `Выбрано: ${value.length}`;

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border border-ink-300 bg-white px-3 text-left transition-colors',
          size === 'md' ? 'h-10 text-sm' : 'h-9 text-[13px]',
          'hover:border-ink-400 focus:border-brand-500 focus:outline-2 focus:outline-brand-200',
        )}
      >
        <span className="min-w-0 truncate">
          {prefix && <span className="text-ink-500">{prefix} · </span>}
          <span className={value.length === 0 ? 'text-ink-500' : 'text-ink-900'}>{summary}</span>
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute top-full z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-ink-200 bg-white p-1 shadow-[var(--shadow-pop)]"
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-ink-700 hover:bg-ink-50"
            >
              <input
                type="checkbox"
                className="size-4 shrink-0 cursor-pointer accent-brand-600"
                checked={value.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
              <span className="truncate">{option.label}</span>
            </label>
          ))}
          {value.length > 0 && (
            <button
              type="button"
              className="mt-1 w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-[12px] text-brand-600 hover:bg-brand-50"
              onClick={() => onChange([])}
            >
              Сбросить выбор
            </button>
          )}
        </div>
      )}
    </div>
  );
}
