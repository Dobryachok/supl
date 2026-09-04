import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, FileSpreadsheet, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Checkbox, Input, Select, Switch } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { ProductImage } from '@/components/ui/ProductImage';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { TD, TH, THead, TR, Table } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { categories, categoryById } from '@/data/categories';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { cn } from '@/lib/cn';
import { uid } from '@/lib/ids';
import { money, qty as formatQty, withCount } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { productsOfSupplier } from '@/store/selectors';

const PAGE_SIZE = 12;

export function SellerProductsPage() {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();
  const loading = useSimulatedLoad([state.session.sellerSupplierId]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [onlyInactive, setOnlyInactive] = useState(false);
  const [onlyZero, setOnlyZero] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const all = productsOfSupplier(state, state.session.sellerSupplierId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((product) => {
      if (categoryId && product.categoryId !== categoryId) return false;
      if (onlyInactive && product.isActive) return false;
      if (onlyZero && product.stock > 0) return false;
      if (q && !`${product.name} ${product.article} ${product.brand}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [all, query, categoryId, onlyInactive, onlyZero]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allSelected = pageItems.length > 0 && pageItems.every((p) => selected.includes(p.id));

  const duplicate = (productId: string) => {
    const source = all.find((p) => p.id === productId);
    if (!source) return;
    dispatch({
      type: 'products/upsert',
      product: {
        ...source,
        id: uid('p'),
        name: `${source.name} (копия)`,
        article: `${source.article}-C`,
        createdAt: new Date().toISOString(),
        isActive: false,
      },
    });
    toast.success('Товар скопирован', 'Копия создана как черновик (выключена)');
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px]">Каталог товаров</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {withCount(all.length, 'позиция', 'позиции', 'позиций')} ·{' '}
            {all.filter((p) => p.isActive).length} опубликовано ·{' '}
            {all.filter((p) => p.stock <= 0).length} без остатка
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton
            to="/seller/products/import"
            variant="secondary"
            icon={<FileSpreadsheet className="size-4" />}
          >
            Импорт CSV
          </LinkButton>
          <LinkButton to="/seller/products/new" icon={<Plus className="size-4" />}>
            Добавить товар
          </LinkButton>
        </div>
      </div>

      <div className="card mt-4 flex flex-wrap items-center gap-3 p-3">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Название, артикул, бренд"
          leading={<Search className="size-4" />}
          className="w-full sm:w-72"
        />
        <Select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          className="h-10 w-56"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Switch
          checked={onlyZero}
          onChange={(e) => setOnlyZero(e.target.checked)}
          label="Только без остатка"
        />
        <Switch
          checked={onlyInactive}
          onChange={(e) => setOnlyInactive(e.target.checked)}
          label="Только выключенные"
        />
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3">
          <p className="text-[13px] font-medium text-brand-800">
            Выбрано {withCount(selected.length, 'товар', 'товара', 'товаров')}
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                dispatch({ type: 'products/toggleActive', productIds: selected, isActive: true });
                toast.success('Товары опубликованы');
              }}
            >
              Включить
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                dispatch({ type: 'products/toggleActive', productIds: selected, isActive: false });
                toast.info('Товары сняты с публикации');
              }}
            >
              Выключить
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="size-3.5" />}
              onClick={() => setDeleteOpen(true)}
            >
              Удалить
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              Снять выделение
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3">
        {loading ? (
          <RowsSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package className="size-6" />}
            title="Товаров не найдено"
            text="Измените фильтры или добавьте новую позицию в каталог."
            action={<LinkButton to="/seller/products/new">Добавить товар</LinkButton>}
          />
        ) : (
          <div className="card overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH width="3%">
                    <Checkbox
                      checked={allSelected}
                      onChange={() =>
                        setSelected(
                          allSelected
                            ? selected.filter((id) => !pageItems.some((p) => p.id === id))
                            : [
                                ...selected,
                                ...pageItems.map((p) => p.id).filter((id) => !selected.includes(id)),
                              ],
                        )
                      }
                    />
                  </TH>
                  <TH>Товар</TH>
                  <TH width="14%">Категория</TH>
                  <TH width="10%" align="right">
                    Цена
                  </TH>
                  <TH width="12%" align="right">
                    Остаток
                  </TH>
                  <TH width="10%">Статус</TH>
                  <TH width="12%" align="right">
                    Действия
                  </TH>
                </TR>
              </THead>
              <tbody>
                {pageItems.map((product) => (
                  <TR key={product.id}>
                    <TD>
                      <Checkbox
                        checked={selected.includes(product.id)}
                        onChange={() =>
                          setSelected((prev) =>
                            prev.includes(product.id)
                              ? prev.filter((id) => id !== product.id)
                              : [...prev, product.id],
                          )
                        }
                      />
                    </TD>
                    <TD>
                      <div className="flex items-center gap-3">
                        <ProductImage product={product} className="size-10 shrink-0" />
                        <div className="min-w-0">
                          <Link
                            to={`/seller/products/${product.id}/edit`}
                            className="line-clamp-1 text-[13px] font-medium text-ink-900 hover:text-brand-700"
                          >
                            {product.name}
                          </Link>
                          <p className="text-xs text-ink-500">
                            арт. {product.article} · {product.packSize}
                          </p>
                        </div>
                      </div>
                    </TD>
                    <TD className="text-[13px] text-ink-600">
                      {categoryById.get(product.categoryId)?.name}
                    </TD>
                    <TD align="right">
                      <p className="text-[13px] font-semibold text-ink-900">
                        {money(product.price)}
                      </p>
                      {product.oldPrice && (
                        <p className="text-xs text-ink-400 line-through">
                          {money(product.oldPrice)}
                        </p>
                      )}
                    </TD>
                    <TD align="right">
                      <span
                        className={cn(
                          'text-[13px] font-medium',
                          product.stock <= 0
                            ? 'text-danger-600'
                            : product.stock < product.minQty * 3
                              ? 'text-warn-600'
                              : 'text-ink-800',
                        )}
                      >
                        {formatQty(product.stock, product.unit)}
                      </span>
                    </TD>
                    <TD>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({ type: 'products/toggleActive', productIds: [product.id] })
                        }
                        className="cursor-pointer"
                      >
                        <Badge tone={product.isActive ? 'success' : 'neutral'}>
                          {product.isActive ? 'В продаже' : 'Выключен'}
                        </Badge>
                      </button>
                    </TD>
                    <TD align="right">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/seller/products/${product.id}/edit`}
                          className="flex size-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-brand-700"
                          aria-label="Редактировать"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => duplicate(product.id)}
                          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
                          aria-label="Дублировать"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected([product.id]);
                            setDeleteOpen(true);
                          }}
                          className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-500 hover:bg-danger-50 hover:text-danger-600"
                          aria-label="Удалить"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} className="mt-5" />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Удалить товары"
        description={`Будет удалено ${withCount(selected.length, 'позиция', 'позиции', 'позиций')}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                dispatch({ type: 'products/remove', productIds: selected });
                toast.info('Товары удалены из каталога');
                setSelected([]);
                setDeleteOpen(false);
              }}
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-600">
          Позиции пропадут из каталога и корзин ресторанов. Уже созданные заявки не изменятся.
        </p>
      </Modal>
    </div>
  );
}
