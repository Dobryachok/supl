import { LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select, toolbarInputShellClass, toolbarSelectClass } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import type { CatalogSort } from '@/store/selectors';
import { catalogGridClass } from './ProductGrid';

export type SortOption<T extends string = string> = { value: T; label: string };

const catalogSortOptions: SortOption<CatalogSort>[] = [
  { value: 'popular', label: 'Сначала популярные' },
  { value: 'price-asc', label: 'Цена: по возрастанию' },
  { value: 'price-desc', label: 'Цена: по убыванию' },
  { value: 'discount', label: 'Сначала со скидкой' },
  { value: 'new', label: 'Сначала новинки' },
  { value: 'name', label: 'По названию' },
];

export function SortBar<T extends string = CatalogSort>({
  sort,
  onSortChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Поиск в категории',
  view = 'grid',
  onViewChange,
  showViewToggle = true,
  sortOptions = catalogSortOptions as SortOption<T>[],
  onOpenFilters,
  filterCount,
  columns = 4,
  className,
}: {
  sort: T;
  onSortChange: (sort: T) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  view?: 'grid' | 'list';
  onViewChange?: (view: 'grid' | 'list') => void;
  showViewToggle?: boolean;
  sortOptions?: SortOption<T>[];
  onOpenFilters?: () => void;
  filterCount?: number;
  columns?: 3 | 4 | 5;
  className?: string;
}) {
  const searchSpan =
    columns === 5 ? 'col-span-2 sm:col-span-2 xl:col-span-4' : 'col-span-2 sm:col-span-2 xl:col-span-3';
  const controlsSpan = 'col-span-2 sm:col-span-1 xl:col-span-1';
  const controlHeight = 'h-10';

  return (
    <div className={cn(catalogGridClass(columns), 'items-center', className)}>
      <div className={cn('flex min-w-0 items-center gap-2', searchSpan)}>
        {onOpenFilters && (
          <Button
            variant="secondary"
            size="md"
            className="shrink-0 lg:hidden"
            icon={<SlidersHorizontal className="size-4" />}
            onClick={onOpenFilters}
          >
            Фильтры{filterCount ? ` (${filterCount})` : ''}
          </Button>
        )}
        <Input
          leading={<Search className="size-4" />}
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={toolbarInputShellClass}
          aria-label="Поиск"
        />
      </div>

      <div className={cn('flex min-w-0 items-center gap-2', controlsSpan)}>
        <Select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as T)}
          className={toolbarSelectClass}
          aria-label="Сортировка"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {showViewToggle && onViewChange && (
          <div className={cn(controlHeight, 'flex shrink-0 overflow-hidden rounded-lg border border-ink-300')}>
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              className={cn(
                'flex h-full w-10 cursor-pointer items-center justify-center',
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
                'flex h-full w-10 cursor-pointer items-center justify-center border-l border-ink-200',
                view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50',
              )}
              aria-label="Список"
            >
              <List className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
