import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/cn';

export type CatalogView = 'list' | 'grid';

export function CatalogViewToggle({
  value,
  onChange,
  className,
}: {
  value: CatalogView;
  onChange: (view: CatalogView) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-10 shrink-0 overflow-hidden rounded-lg border border-ink-300',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange('list')}
        className={cn(
          'flex size-10 cursor-pointer items-center justify-center',
          value === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50',
        )}
        aria-label="Список"
        title="Список"
      >
        <List className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={cn(
          'flex size-10 cursor-pointer items-center justify-center border-l border-ink-200',
          value === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50',
        )}
        aria-label="Карточки"
        title="Карточки"
      >
        <LayoutGrid className="size-4" />
      </button>
    </div>
  );
}
