import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Store } from 'lucide-react';
import { Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Checkbox, Input, Select, Switch } from '@/components/ui/Field';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { SupplierCard } from '@/components/catalog/SupplierCard';
import { categories } from '@/data/categories';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { productsOfSupplier } from '@/store/selectors';

type Sort = 'rating' | 'orders' | 'minOrder' | 'name';

export function SuppliersPage() {
  const state = useAppState();
  const loading = useSimulatedLoad([]);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [manufacturerOnly, setManufacturerOnly] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('rating');

  const cities = useMemo(
    () => Array.from(new Set(state.suppliers.map((s) => s.city))).sort((a, b) => a.localeCompare(b, 'ru')),
    [state.suppliers],
  );

  const result = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = state.suppliers.filter((supplier) => {
      if (city && supplier.city !== city) return false;
      if (verifiedOnly && !supplier.verified) return false;
      if (manufacturerOnly && !supplier.isManufacturer) return false;
      if (favoriteOnly && !state.favoriteSuppliers.includes(supplier.id)) return false;
      if (categoryIds.length && !categoryIds.some((id) => supplier.categoryIds.includes(id)))
        return false;
      if (q) {
        const haystack = `${supplier.name} ${supplier.legalName} ${supplier.description} ${supplier.inn}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    switch (sort) {
      case 'orders':
        return list.sort((a, b) => b.ordersCount - a.ordersCount);
      case 'minOrder':
        return list.sort((a, b) => a.minOrder - b.minOrder);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      default:
        return list.sort((a, b) => b.rating - a.rating);
    }
  }, [state, query, city, categoryIds, verifiedOnly, manufacturerOnly, favoriteOnly, sort]);

  const reset = () => {
    setQuery('');
    setCity('');
    setCategoryIds([]);
    setVerifiedOnly(false);
    setManufacturerOnly(false);
    setFavoriteOnly(false);
  };

  const hasFilters =
    Boolean(query || city || categoryIds.length) ||
    verifiedOnly ||
    manufacturerOnly ||
    favoriteOnly;

  return (
    <div className="page pt-5">
      <nav className="flex items-center gap-1.5 text-[13px] text-ink-500">
        <Link to="/" className="hover:text-brand-600">
          Главная
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-ink-700">Поставщики</span>
      </nav>

      <h1 className="mt-2 text-[26px]">Поставщики продуктов для ресторанов</h1>
      <p className="mt-1 text-[13px] text-ink-500">
        В каталоге {withCount(state.suppliers.length, 'компания', 'компании', 'компаний')} ·
        обновлено {new Date().toLocaleDateString('ru-RU')}
      </p>

      <div className="mt-4 flex gap-5">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="card p-4">
            <p className="text-sm font-bold text-ink-900">Фильтры</p>

            <div className="mt-3 space-y-3">
              <Input
                placeholder="Название или ИНН"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Все города</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <div className="space-y-2">
                <Switch
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  label="Только проверенные"
                />
                <Switch
                  checked={manufacturerOnly}
                  onChange={(e) => setManufacturerOnly(e.target.checked)}
                  label="Производители"
                />
                <Switch
                  checked={favoriteOnly}
                  onChange={(e) => setFavoriteOnly(e.target.checked)}
                  label="Только избранные"
                />
              </div>
            </div>

            <div className="mt-4 border-t border-ink-100 pt-3">
              <p className="mb-1.5 text-[13px] font-semibold text-ink-900">Категории</p>
              {categories.map((category) => (
                <Checkbox
                  key={category.id}
                  label={category.name}
                  count={state.suppliers.filter((s) => s.categoryIds.includes(category.id)).length}
                  checked={categoryIds.includes(category.id)}
                  onChange={() =>
                    setCategoryIds((prev) =>
                      prev.includes(category.id)
                        ? prev.filter((id) => id !== category.id)
                        : [...prev, category.id],
                    )
                  }
                />
              ))}
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={reset}>
                Сбросить все
              </Button>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Поиск поставщика"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="max-w-xs lg:hidden"
            />
            <p className="text-[13px] text-ink-500">
              {withCount(result.length, 'поставщик', 'поставщика', 'поставщиков')}
            </p>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="ml-auto h-9 w-56 text-[13px]"
            >
              <option value="rating">Сначала с высоким рейтингом</option>
              <option value="orders">Сначала популярные</option>
              <option value="minOrder">Минимальный заказ ниже</option>
              <option value="name">По названию</option>
            </Select>
          </div>

          {categoryIds.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {categoryIds.map((id) => (
                <Chip
                  key={id}
                  onRemove={() => setCategoryIds((prev) => prev.filter((v) => v !== id))}
                >
                  {categories.find((c) => c.id === id)?.name}
                </Chip>
              ))}
            </div>
          )}

          <div className="mt-3 space-y-3">
            {loading ? (
              <RowsSkeleton count={4} />
            ) : result.length === 0 ? (
              <EmptyState
                icon={<Store className="size-6" />}
                title="Поставщики не найдены"
                text="Смягчите фильтры: снимите ограничение по городу или категории."
                action={
                  <Button variant="secondary" onClick={reset}>
                    Сбросить фильтры
                  </Button>
                }
              />
            ) : (
              result.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))
            )}
          </div>

          {!loading && result.length > 0 && (
            <p className="mt-4 text-xs text-ink-400">
              Всего товаров у выбранных поставщиков:{' '}
              {result.reduce((sum, s) => sum + productsOfSupplier(state, s.id).length, 0)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
