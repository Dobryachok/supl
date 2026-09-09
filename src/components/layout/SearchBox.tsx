import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Search, Store, Tag, X } from 'lucide-react';
import { categories } from '@/data/categories';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/cn';
import { money } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { filterProducts } from '@/store/selectors';
import { ProductImage, SupplierLogo } from '@/components/ui/ProductImage';

export function SearchBox({ className }: { className?: string }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(query, 180);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  const suggestions = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (q.length < 2) return null;
    const products = filterProducts(state, { query: q }, 'popular').slice(0, 6);
    const matchedSuppliers = state.suppliers
      .filter((s) => s.name.toLowerCase().includes(q) || s.legalName.toLowerCase().includes(q))
      .slice(0, 3);
    const matchedCategories = categories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.subcategories.some((s) => s.name.toLowerCase().includes(q)),
      )
      .slice(0, 3);
    return { products, suppliers: matchedSuppliers, categories: matchedCategories };
  }, [debounced, state]);

  const submit = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    dispatch({ type: 'search/remember', query: trimmed });
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const hasResults =
    suggestions &&
    (suggestions.products.length || suggestions.suppliers.length || suggestions.categories.length);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(query);
        }}
        className="flex items-center gap-2 rounded-lg border border-ink-300 bg-white pl-3 transition-colors focus-within:border-brand-500 focus-within:outline-2 focus-within:outline-brand-200"
      >
        <Search className="size-4 shrink-0 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск по товарам, поставщикам, артикулам"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mr-1 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
            aria-label="Очистить поиск"
          >
            <X className="size-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="m-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-brand-600 px-3.5 text-[13px] font-medium text-white hover:bg-brand-700"
        >
          Найти
        </button>
      </form>

      {open && (
        <div className="animate-fade-in absolute top-full left-0 z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-ink-200 bg-white shadow-[var(--shadow-pop)]">
          {!suggestions ? (
            <div className="p-3">
              <p className="px-1 pb-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                Вы искали
              </p>
              {state.recentSearches.length ? (
                state.recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => submit(item)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink-700 hover:bg-ink-50"
                  >
                    <Clock className="size-3.5 text-ink-400" />
                    {item}
                  </button>
                ))
              ) : (
                <p className="px-2 py-1.5 text-sm text-ink-500">Введите название или артикул</p>
              )}
            </div>
          ) : !hasResults ? (
            <p className="p-4 text-sm text-ink-500">
              Ничего не нашли по запросу «{debounced}». Попробуйте артикул или название бренда.
            </p>
          ) : (
            <div className="scroll-thin max-h-[70vh] overflow-y-auto">
              {suggestions.products.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                    Товары
                  </p>
                  {suggestions.products.map((product) => {
                    const supplier = state.suppliers.find((s) => s.id === product.supplierId);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/product/${product.id}`);
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-50"
                      >
                        <ProductImage product={product} className="size-9 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink-800">
                            {product.name}
                          </span>
                          <span className="block truncate text-xs text-ink-500">
                            {supplier?.name} · {product.packSize}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-ink-900">
                          {money(product.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {suggestions.suppliers.length > 0 && (
                <div className="border-t border-ink-100 p-2">
                  <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                    Поставщики
                  </p>
                  {suggestions.suppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate(`/suppliers/${supplier.id}`);
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-50"
                    >
                      <SupplierLogo name={supplier.name} hue={supplier.hue} className="size-9" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink-800">{supplier.name}</span>
                        <span className="block truncate text-xs text-ink-500">
                          {supplier.city} · рейтинг {supplier.rating}
                        </span>
                      </span>
                      <Store className="size-4 text-ink-300" />
                    </button>
                  ))}
                </div>
              )}

              {suggestions.categories.length > 0 && (
                <div className="border-t border-ink-100 p-2">
                  <p className="px-2 py-1 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                    Категории
                  </p>
                  {suggestions.categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate(`/catalog/${category.slug}`);
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-ink-700 hover:bg-ink-50"
                    >
                      <Tag className="size-4 text-ink-400" />
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
