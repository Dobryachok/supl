import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Store, Trash2 } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { SortBar } from '@/components/catalog/SortBar';
import { SupplierCard } from '@/components/catalog/SupplierCard';
import { useCartActions } from '@/hooks/useCartActions';
import { money, dateFull, withCount } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { filterProducts, productsById } from '@/store/selectors';
import type { CatalogSort } from '@/store/selectors';

export function FavoritesPage() {
  const state = useAppState();
  const dispatch = useDispatch();
  const cart = useCartActions();
  const toast = useToast();
  const [tab, setTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<CatalogSort>('popular');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const products = productsById(state);
  const favoriteProducts = state.favoriteProducts
    .map((id) => products.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const displayedProducts = useMemo(
    () =>
      filterProducts(
        state,
        { favoriteOnly: true, query: searchQuery || undefined },
        sort,
      ),
    [state, searchQuery, sort],
  );
  const favoriteSuppliers = state.favoriteSuppliers
    .map((id) => state.suppliers.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="page pt-5">
      <h1 className="text-[26px]">Избранное и шаблоны закупок</h1>
      <p className="mt-1 text-[13px] text-ink-500">
        Часто закупаемые позиции, проверенные поставщики и готовые наборы для повторных заявок
      </p>

      <Tabs
        className="mt-4"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'products', label: 'Товары', count: favoriteProducts.length },
          { id: 'suppliers', label: 'Поставщики', count: favoriteSuppliers.length },
          { id: 'templates', label: 'Шаблоны закупок', count: state.templates.length },
        ]}
      />

      <div className="mt-4">
        {tab === 'products' &&
          (favoriteProducts.length === 0 ? (
            <EmptyState
              icon={<Heart className="size-6" />}
              title="В избранном пока пусто"
              text="Нажимайте на сердечко в карточке товара — позиции появятся здесь."
              action={<LinkButton to="/catalog">В каталог</LinkButton>}
            />
          ) : (
            <>
              <SortBar
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Поиск в избранном"
                columns={5}
                className="mb-3"
              />
              {displayedProducts.length === 0 ? (
                <EmptyState title="Товары не найдены" text="Попробуйте другой запрос." compact />
              ) : (
                <ProductGrid products={displayedProducts} view={view} columns={5} />
              )}
            </>
          ))}

        {tab === 'suppliers' &&
          (favoriteSuppliers.length === 0 ? (
            <EmptyState
              icon={<Store className="size-6" />}
              title="Избранных поставщиков нет"
              text="Добавляйте компании, с которыми работаете постоянно."
              action={<LinkButton to="/suppliers">К поставщикам</LinkButton>}
            />
          ) : (
            <div className="space-y-3">
              {favoriteSuppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
              ))}
            </div>
          ))}

        {tab === 'templates' &&
          (state.templates.length === 0 ? (
            <EmptyState
              title="Шаблонов пока нет"
              text="Сохраните корзину или состав заявки как шаблон — и повторяйте закупку в один клик."
              action={<LinkButton to="/cart">Открыть корзину</LinkButton>}
            />
          ) : (
            <div className="space-y-3">
              {state.templates.map((template) => {
                const lines = template.items
                  .map((item) => ({ product: products.get(item.productId), qty: item.qty }))
                  .filter((l) => l.product);
                const total = lines.reduce(
                  (sum, l) => sum + (l.product?.price ?? 0) * l.qty,
                  0,
                );
                const suppliers = new Set(lines.map((l) => l.product!.supplierId));
                return (
                  <div key={template.id} className="card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-bold text-ink-900">{template.name}</p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          создан {dateFull(template.createdAt)} ·{' '}
                          {withCount(lines.length, 'позиция', 'позиции', 'позиций')} ·{' '}
                          {withCount(suppliers.size, 'поставщик', 'поставщика', 'поставщиков')}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          icon={<ShoppingCart className="size-3.5" />}
                          onClick={() =>
                            cart.addMany(template.items, `Шаблон «${template.name}» в корзине`)
                          }
                        >
                          Применить — {money(total)}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger-600"
                          icon={<Trash2 className="size-3.5" />}
                          onClick={() => {
                            dispatch({ type: 'templates/remove', id: template.id });
                            toast.info('Шаблон удалён', template.name);
                          }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>

                    <ul className="mt-3 divide-y divide-ink-100 border-t border-ink-100 pt-1">
                      {lines.map((line) => {
                        const supplier = state.suppliers.find(
                          (s) => s.id === line.product!.supplierId,
                        );
                        return (
                          <li
                            key={line.product!.id}
                            className="flex flex-wrap items-center gap-3 py-2"
                          >
                            {supplier && (
                              <SupplierLogo
                                name={supplier.name}
                                hue={supplier.hue}
                                className="size-8 text-[10px]"
                              />
                            )}
                            <Link
                              to={`/product/${line.product!.id}`}
                              className="min-w-0 flex-1 truncate text-[13px] text-ink-800 hover:text-brand-700"
                            >
                              {line.product!.name}
                            </Link>
                            <span className="text-[13px] text-ink-500">{line.qty}</span>
                            <span className="w-24 text-right text-[13px] font-semibold text-ink-900">
                              {money(line.product!.price * line.qty)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
      </div>
    </div>
  );
}
