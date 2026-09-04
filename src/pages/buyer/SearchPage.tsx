import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Drawer } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { Tabs } from '@/components/ui/Tabs';
import {
  FiltersSidebar,
  activeFilterCount,
  emptyFilters,
} from '@/components/catalog/FiltersSidebar';
import type { FilterState } from '@/components/catalog/FiltersSidebar';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { SortBar } from '@/components/catalog/SortBar';
import { SupplierCard } from '@/components/catalog/SupplierCard';
import { categories } from '@/data/categories';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { filterProducts } from '@/store/selectors';
import type { CatalogSort } from '@/store/selectors';

const PAGE_SIZE = 12;

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const state = useAppState();
  const [tab, setTab] = useState('products');
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [sort, setSort] = useState<CatalogSort>('popular');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loading = useSimulatedLoad([query]);

  const pool = useMemo(() => filterProducts(state, { query }, 'popular'), [state, query]);

  const result = useMemo(
    () =>
      filterProducts(
        state,
        {
          query,
          supplierIds: filters.suppliers,
          brands: filters.brands,
          countries: filters.countries,
          tempModes: filters.temps,
          priceFrom: filters.priceFrom ? Number(filters.priceFrom) : undefined,
          priceTo: filters.priceTo ? Number(filters.priceTo) : undefined,
          inStockOnly: filters.inStockOnly,
          discountOnly: filters.discountOnly,
          fastDeliveryOnly: filters.fastDeliveryOnly,
        },
        sort,
      ),
    [state, query, filters, sort],
  );

  const matchedSuppliers = state.suppliers.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.legalName.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      pool.some((p) => p.supplierId === s.id)
    );
  });

  const matchedCategories = categories.filter((c) =>
    pool.some((p) => p.categoryId === c.id),
  );

  const pageCount = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = result.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const sidebar = (
    <FiltersSidebar
      pool={pool}
      filters={filters}
      onChange={(next) => {
        setFilters(next);
        setPage(1);
      }}
      onReset={() => setFilters(emptyFilters)}
    />
  );

  return (
    <div className="page pt-5">
      <h1 className="text-[24px]">Результаты поиска: «{query}»</h1>
      <p className="mt-1 text-[13px] text-ink-500">
        {withCount(pool.length, 'товар', 'товара', 'товаров')} ·{' '}
        {withCount(matchedSuppliers.length, 'поставщик', 'поставщика', 'поставщиков')}
      </p>

      <Tabs
        className="mt-4"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'products', label: 'Товары', count: pool.length },
          { id: 'suppliers', label: 'Поставщики', count: matchedSuppliers.length },
          { id: 'categories', label: 'Категории', count: matchedCategories.length },
        ]}
      />

      {tab === 'products' && (
        <div className="mt-4 flex gap-5">
          <div className="hidden w-[260px] shrink-0 lg:block">{sidebar}</div>
          <div className="min-w-0 flex-1">
            <SortBar
              total={result.length}
              sort={sort}
              onSortChange={setSort}
              view={view}
              onViewChange={setView}
              onOpenFilters={() => setDrawerOpen(true)}
              filterCount={activeFilterCount(filters)}
              className="mb-3"
            />
            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : pageItems.length === 0 ? (
              <EmptyState
                icon={<SearchX className="size-6" />}
                title="Ничего не нашли"
                text="Проверьте написание, попробуйте артикул или название бренда."
                action={
                  <Button variant="secondary" onClick={() => setFilters(emptyFilters)}>
                    Сбросить фильтры
                  </Button>
                }
              />
            ) : (
              <>
                <ProductGrid products={pageItems} view={view} />
                <Pagination
                  page={currentPage}
                  pageCount={pageCount}
                  onChange={setPage}
                  className="mt-6"
                />
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="mt-4 space-y-3">
          {matchedSuppliers.length === 0 ? (
            <EmptyState title="Поставщики не найдены" compact />
          ) : (
            matchedSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))
          )}
        </div>
      )}

      {tab === 'categories' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matchedCategories.map((category) => (
            <Link
              key={category.id}
              to={`/catalog/${category.slug}`}
              className="card flex items-center gap-3 p-4 hover:shadow-[var(--shadow-hover)]"
            >
              <SupplierLogo name={category.name} hue={category.hue} className="size-11" />
              <span>
                <span className="block text-sm font-semibold text-ink-900">{category.name}</span>
                <span className="block text-xs text-ink-500">
                  {pool.filter((p) => p.categoryId === category.id).length} совпадений
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Фильтры" side="left">
        {sidebar}
      </Drawer>
    </div>
  );
}
