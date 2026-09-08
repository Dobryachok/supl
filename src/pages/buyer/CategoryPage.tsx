import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, SearchX } from 'lucide-react';
import { Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import {
  FiltersSidebar,
  activeFilterCount,
  emptyFilters,
  toggleInArray,
} from '@/components/catalog/FiltersSidebar';
import type { FilterState } from '@/components/catalog/FiltersSidebar';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { SortBar } from '@/components/catalog/SortBar';
import { categories, categoryBySlug } from '@/data/categories';
import { tempModeLabel } from '@/data/products';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { cn } from '@/lib/cn';
import { withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { activeProducts, filterProducts } from '@/store/selectors';
import type { CatalogSort } from '@/store/selectors';
import { NotFoundPage } from './NotFoundPage';

const PAGE_SIZE = 12;

export function CategoryPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useAppState();
  const category = categoryBySlug.get(slug);

  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<CatalogSort>('popular');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loading = useSimulatedLoad([slug]);

  const subSlug = searchParams.get('sub');

  useEffect(() => {
    if (!category) return;
    const sub = category.subcategories.find((s) => s.slug === subSlug);
    setFilters({ ...emptyFilters, subs: sub ? [sub.id] : [] });
    setSearchQuery('');
    setPage(1);
  }, [slug, subSlug, category]);

  const pool = useMemo(
    () => (category ? activeProducts(state).filter((p) => p.categoryId === category.id) : []),
    [state, category],
  );

  const result = useMemo(() => {
    if (!category) return [];
    return filterProducts(
      state,
      {
        categoryId: category.id,
        query: searchQuery || undefined,
        subcategoryIds: filters.subs,
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
    );
  }, [state, category, filters, sort, searchQuery]);

  if (!category) return <NotFoundPage />;

  const pageCount = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = result.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateFilters = (next: FilterState) => {
    setFilters(next);
    setPage(1);
  };

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.subs.map((id) => ({
      key: `sub-${id}`,
      label: category.subcategories.find((s) => s.id === id)?.name ?? id,
      onRemove: () => updateFilters({ ...filters, subs: toggleInArray(filters.subs, id) }),
    })),
    ...filters.suppliers.map((id) => ({
      key: `sup-${id}`,
      label: state.suppliers.find((s) => s.id === id)?.name ?? id,
      onRemove: () =>
        updateFilters({ ...filters, suppliers: toggleInArray(filters.suppliers, id) }),
    })),
    ...filters.brands.map((brand) => ({
      key: `brand-${brand}`,
      label: brand,
      onRemove: () => updateFilters({ ...filters, brands: toggleInArray(filters.brands, brand) }),
    })),
    ...filters.countries.map((country) => ({
      key: `country-${country}`,
      label: country,
      onRemove: () =>
        updateFilters({ ...filters, countries: toggleInArray(filters.countries, country) }),
    })),
    ...filters.temps.map((temp) => ({
      key: `temp-${temp}`,
      label: tempModeLabel(temp),
      onRemove: () => updateFilters({ ...filters, temps: toggleInArray(filters.temps, temp) }),
    })),
    ...(filters.inStockOnly
      ? [
          {
            key: 'stock',
            label: 'Только в наличии',
            onRemove: () => updateFilters({ ...filters, inStockOnly: false }),
          },
        ]
      : []),
    ...(filters.discountOnly
      ? [
          {
            key: 'discount',
            label: 'Со скидкой',
            onRemove: () => updateFilters({ ...filters, discountOnly: false }),
          },
        ]
      : []),
    ...(filters.fastDeliveryOnly
      ? [
          {
            key: 'fast',
            label: 'Доставка на следующий день',
            onRemove: () => updateFilters({ ...filters, fastDeliveryOnly: false }),
          },
        ]
      : []),
  ];

  const sidebar = (
    <FiltersSidebar
      pool={pool}
      category={category}
      filters={filters}
      onChange={updateFilters}
      onReset={() => {
        updateFilters(emptyFilters);
        setSearchParams({});
      }}
    />
  );

  return (
    <div className="page pt-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-500">
        <Link to="/" className="hover:text-brand-600">
          Главная
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to="/catalog" className="hover:text-brand-600">
          Каталог
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-ink-700">{category.name}</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px]">{category.name} оптом от поставщиков</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {withCount(pool.length, 'предложение', 'предложения', 'предложений')} ·{' '}
            {withCount(
              new Set(pool.map((p) => p.supplierId)).size,
              'поставщик',
              'поставщика',
              'поставщиков',
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-5">
        <div className="hidden w-[260px] shrink-0 lg:block">
          <div className="card mb-3 p-3">
            <p className="px-1 pb-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
              Категории
            </p>
            <ul>
              {categories.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/catalog/${item.slug}`}
                    className={cn(
                      'flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-[13px]',
                      item.id === category.id
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-ink-700 hover:bg-ink-50',
                    )}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs text-ink-400">
                      {state.products.filter((p) => p.isActive && p.categoryId === item.id).length}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {sidebar}
        </div>

        <div className="min-w-0 flex-1">
          <SortBar
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            onOpenFilters={() => setDrawerOpen(true)}
            filterCount={activeFilterCount(filters)}
            searchQuery={searchQuery}
            onSearchChange={(query) => {
              setSearchQuery(query);
              setPage(1);
            }}
            className="mb-3"
          />

          {chips.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <Chip key={chip.key} onRemove={chip.onRemove}>
                  {chip.label}
                </Chip>
              ))}
              <Button size="sm" variant="ghost" onClick={() => updateFilters(emptyFilters)}>
                Сбросить всё
              </Button>
            </div>
          )}

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : pageItems.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-6" />}
              title="Под фильтры ничего не подошло"
              text="Попробуйте убрать часть условий или посмотреть соседние подкатегории."
              action={
                <Button variant="secondary" onClick={() => updateFilters(emptyFilters)}>
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
                onChange={(next) => {
                  setPage(next);
                  window.scrollTo({ top: 200, behavior: 'smooth' });
                }}
                className="mt-6"
              />
            </>
          )}
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Фильтры" side="left">
        {sidebar}
        <Button block className="mt-3" onClick={() => setDrawerOpen(false)}>
          Показать {result.length}
        </Button>
      </Drawer>
    </div>
  );
}
