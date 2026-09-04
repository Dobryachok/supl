import { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, Switch } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { tempModeLabel } from '@/data/products';
import { money } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import type { Category, Product, TempMode } from '@/types';

export interface FilterState {
  subs: string[];
  suppliers: string[];
  brands: string[];
  countries: string[];
  temps: TempMode[];
  priceFrom: string;
  priceTo: string;
  inStockOnly: boolean;
  discountOnly: boolean;
  fastDeliveryOnly: boolean;
}

export const emptyFilters: FilterState = {
  subs: [],
  suppliers: [],
  brands: [],
  countries: [],
  temps: [],
  priceFrom: '',
  priceTo: '',
  inStockOnly: false,
  discountOnly: false,
  fastDeliveryOnly: false,
};

export function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function activeFilterCount(filters: FilterState): number {
  return (
    filters.subs.length +
    filters.suppliers.length +
    filters.brands.length +
    filters.countries.length +
    filters.temps.length +
    (filters.priceFrom ? 1 : 0) +
    (filters.priceTo ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.discountOnly ? 1 : 0) +
    (filters.fastDeliveryOnly ? 1 : 0)
  );
}

function Group({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ink-100 py-3 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between text-left text-[13px] font-semibold text-ink-900"
      >
        {title}
        <ChevronDown className={cn('size-4 text-ink-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function Facet({
  options,
  selected,
  onToggle,
  limit = 6,
}: {
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onToggle: (value: string) => void;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, limit);
  if (!options.length) return <p className="text-xs text-ink-400">Нет вариантов</p>;
  return (
    <div>
      {visible.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          count={option.count}
          checked={selected.includes(option.value)}
          onChange={() => onToggle(option.value)}
        />
      ))}
      {options.length > limit && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 cursor-pointer text-xs font-medium text-brand-600 hover:underline"
        >
          {expanded ? 'Свернуть' : `Показать ещё ${options.length - limit}`}
        </button>
      )}
    </div>
  );
}

function facetOptions(
  pool: Product[],
  key: (p: Product) => string,
  label: (value: string) => string,
) {
  const counts = new Map<string, number>();
  for (const product of pool) {
    const value = key(product);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count, label: label(value) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru'));
}

export function FiltersSidebar({
  pool,
  category,
  filters,
  onChange,
  onReset,
  className,
}: {
  pool: Product[];
  category?: Category;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  className?: string;
}) {
  const state = useAppState();
  const patch = (part: Partial<FilterState>) => onChange({ ...filters, ...part });
  const prices = pool.map((p) => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const supplierOptions = facetOptions(
    pool,
    (p) => p.supplierId,
    (id) => state.suppliers.find((s) => s.id === id)?.name ?? id,
  );
  const brandOptions = facetOptions(pool, (p) => p.brand, (v) => v);
  const countryOptions = facetOptions(pool, (p) => p.country, (v) => v);
  const tempOptions = facetOptions(pool, (p) => p.tempMode, (v) => tempModeLabel(v as TempMode));
  const subOptions = category
    ? category.subcategories
        .map((sub) => ({
          value: sub.id,
          label: sub.name,
          count: pool.filter((p) => p.subcategoryId === sub.id).length,
        }))
        .filter((o) => o.count > 0)
    : [];

  return (
    <div className={cn('card p-4', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink-900">Фильтры</p>
        {activeFilterCount(filters) > 0 && (
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw className="size-3.5" />}
            onClick={onReset}
          >
            Сбросить
          </Button>
        )}
      </div>

      <div className="mt-1">
        <Group title="Быстрые фильтры">
          <div className="space-y-2 py-1">
            <Switch
              checked={filters.inStockOnly}
              onChange={(e) => patch({ inStockOnly: e.target.checked })}
              label="Только в наличии"
            />
            <Switch
              checked={filters.discountOnly}
              onChange={(e) => patch({ discountOnly: e.target.checked })}
              label="Со скидкой"
            />
            <Switch
              checked={filters.fastDeliveryOnly}
              onChange={(e) => patch({ fastDeliveryOnly: e.target.checked })}
              label="Доставка на следующий день"
            />
          </div>
        </Group>

        {subOptions.length > 1 && (
          <Group title="Подкатегория">
            <Facet
              options={subOptions}
              selected={filters.subs}
              onToggle={(value) => patch({ subs: toggleInArray(filters.subs, value) })}
            />
          </Group>
        )}

        <Group title="Цена">
          <div className="flex items-center gap-2">
            <Input
              placeholder={String(Math.floor(minPrice))}
              value={filters.priceFrom}
              inputMode="numeric"
              onChange={(e) => patch({ priceFrom: e.target.value.replace(/\D/g, '') })}
              leading={<span className="text-xs">от</span>}
            />
            <Input
              placeholder={String(Math.ceil(maxPrice))}
              value={filters.priceTo}
              inputMode="numeric"
              onChange={(e) => patch({ priceTo: e.target.value.replace(/\D/g, '') })}
              leading={<span className="text-xs">до</span>}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-ink-400">
            В выборке: {money(minPrice)} — {money(maxPrice)}
          </p>
        </Group>

        <Group title="Температурный режим">
          <Facet
            options={tempOptions}
            selected={filters.temps}
            onToggle={(value) => patch({ temps: toggleInArray(filters.temps, value as TempMode) })}
          />
        </Group>

        <Group title="Поставщик">
          <Facet
            options={supplierOptions}
            selected={filters.suppliers}
            onToggle={(value) => patch({ suppliers: toggleInArray(filters.suppliers, value) })}
          />
        </Group>

        <Group title="Бренд" defaultOpen={false}>
          <Facet
            options={brandOptions}
            selected={filters.brands}
            onToggle={(value) => patch({ brands: toggleInArray(filters.brands, value) })}
          />
        </Group>

        <Group title="Страна" defaultOpen={false}>
          <Facet
            options={countryOptions}
            selected={filters.countries}
            onToggle={(value) => patch({ countries: toggleInArray(filters.countries, value) })}
          />
        </Group>
      </div>
    </div>
  );
}
