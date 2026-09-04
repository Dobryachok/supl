import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  className?: string;
}

function pagesToShow(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({ page, pageCount, onChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav className={cn('flex items-center justify-center gap-1', className)}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:border-ink-300 disabled:pointer-events-none disabled:opacity-40"
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pagesToShow(page, pageCount).map((item, i) =>
        item === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-ink-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={cn(
              'h-9 min-w-9 cursor-pointer rounded-lg border px-2 text-sm font-medium',
              item === page
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
            )}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:border-ink-300 disabled:pointer-events-none disabled:opacity-40"
        aria-label="Следующая страница"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
