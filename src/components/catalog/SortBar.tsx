import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { withCount } from '@/lib/format';
import type { CatalogSort } from '@/store/selectors';

const sortOptions: { value: CatalogSort; label: string }[] = [
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
  { value: 'discount', label: 'Сначала со скидкой' },
  { value: 'new', label: 'Сначала новинки' },
  { value: 'name', label: 'По названию' },
];

export function SortBar({
  total,
  sort,
  onSortChange,
  view,
  onViewChange,
  onOpenFilters,
  filterCount,
  className,
}: {
  total: number;
  sort: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  onOpenFilters?: () => void;
  filterCount?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <p className="text-[13px] text-ink-500">
        {withCount(total, 'товар', 'товара', 'товаров')} в выборке
      </p>
      <div className="ml-auto flex items-center gap-2">
        {onOpenFilters && (
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            icon={<SlidersHorizontal className="size-3.5" />}
            onClick={onOpenFilters}
          >
            Фильтры{filterCount ? ` (${filterCount})` : ''}
          </Button>
        )}
        <Select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as CatalogSort)}
          className="h-9 w-52 text-[13px]"
          aria-label="Сортировка"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <div className="hidden overflow-hidden rounded-lg border border-ink-300 sm:flex">
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            className={cn(
              'flex size-9 cursor-pointer items-center justify-center',
              view === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50',
            )}
            aria-label="Сетка"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={cn(
              'flex size-9 cursor-pointer items-center justify-center border-l border-ink-200',
              view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50',
            )}
            aria-label="Список"
          >
            <List className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
