import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { unitLabel } from '@/lib/format';
import type { Unit } from '@/types';

export interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  unit?: Unit;
  min?: number;
  step?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function QtyStepper({
  value,
  onChange,
  unit,
  min = 1,
  step = 1,
  max,
  size = 'md',
  className,
}: QtyStepperProps) {
  const clamp = (next: number) => {
    const bounded = Math.max(min, max !== undefined ? Math.min(max, next) : next);
    return +bounded.toFixed(2);
  };

  const btn = cn(
    'flex cursor-pointer items-center justify-center text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:pointer-events-none disabled:text-ink-300',
    size === 'sm' ? 'size-7' : 'size-9',
  );

  return (
    <div
      className={cn(
        'inline-flex items-center overflow-hidden rounded-lg border border-ink-300 bg-white',
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label="Уменьшить количество"
      >
        <Minus className="size-3.5" />
      </button>
      <span
        className={cn(
          'flex min-w-14 items-center justify-center gap-1 border-x border-ink-200 px-1 text-center font-semibold text-ink-900',
          size === 'sm' ? 'h-7 text-[13px]' : 'h-9 text-sm',
        )}
      >
        {Number.isInteger(value) ? value : value.toFixed(2)}
        {unit && <span className="text-xs font-normal text-ink-500">{unitLabel(unit)}</span>}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(clamp(value + step))}
        disabled={max !== undefined && value >= max}
        aria-label="Увеличить количество"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
