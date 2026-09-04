import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
  className?: string;
}

export function Rating({ value, count, size = 'sm', showValue = true, className }: RatingProps) {
  const starSize = size === 'sm' ? 'size-3.5' : 'size-4';
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              starSize,
              i <= Math.round(value) ? 'fill-warn-500 text-warn-500' : 'text-ink-300',
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className={cn('font-semibold text-ink-800', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {value.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-ink-400">
          {count > 0 ? `${count} отз.` : 'нет отзывов'}
        </span>
      )}
    </span>
  );
}

export function RatingInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`Оценка ${i}`}
          className="cursor-pointer p-0.5"
        >
          <Star
            className={cn('size-5', i <= value ? 'fill-warn-500 text-warn-500' : 'text-ink-300')}
          />
        </button>
      ))}
    </span>
  );
}
