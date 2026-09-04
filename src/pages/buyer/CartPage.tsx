import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookmarkPlus,
  ShoppingCart,
  Trash2,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Checkbox, Field, Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ProductImage, SupplierLogo } from '@/components/ui/ProductImage';
import { QtyStepper } from '@/components/ui/QtyStepper';
import { useToast } from '@/components/ui/Toast';
import { deliveryDaysLabel } from '@/components/catalog/SupplierCard';
import { useCartActions } from '@/hooks/useCartActions';
import { uid } from '@/lib/ids';
import { dateFull, money, qty as formatQty, relativeDay, withCount } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { cartGroups } from '@/store/selectors';

export function CartPage() {
  const state = useAppState();
  const dispatch = useDispatch();
  const cart = useCartActions();
  const toast = useToast();
  const navigate = useNavigate();
  const groups = useMemo(() => cartGroups(state), [state]);
  const [selected, setSelected] = useState<string[]>(() => groups.map((g) => g.supplier.id));
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const availableIds = groups.map((g) => g.supplier.id);
  const activeSelection = selected.filter((id) => availableIds.includes(id));
  const selectedGroups = groups.filter((g) => activeSelection.includes(g.supplier.id));
  const readyGroups = selectedGroups.filter((g) => g.meetsMinOrder);
  const blockedGroups = selectedGroups.filter((g) => !g.meetsMinOrder);

  const goodsTotal = selectedGroups.reduce((sum, g) => sum + g.goodsTotal, 0);
  const deliveryTotal = selectedGroups.reduce((sum, g) => sum + g.deliveryFee, 0);
  const positions = selectedGroups.reduce((sum, g) => sum + g.lines.length, 0);

  const toggleGroup = (supplierId: string) => {
    setSelected((prev) =>
      prev.includes(supplierId) ? prev.filter((id) => id !== supplierId) : [...prev, supplierId],
    );
  };

  const saveTemplate = () => {
    const items = state.cart.map((item) => ({ productId: item.productId, qty: item.qty }));
    dispatch({
      type: 'templates/create',
      template: {
        id: uid('tpl'),
        name: templateName.trim() || `Закупка от ${dateFull(new Date().toISOString())}`,
        createdAt: new Date().toISOString(),
        items,
      },
    });
    setTemplateOpen(false);
    setTemplateName('');
    toast.success('Шаблон сохранён', 'Найдёте его в разделе «Избранное и шаблоны»');
  };

  if (groups.length === 0) {
    return (
      <div className="page pt-6">
        <h1 className="text-[26px]">Корзина</h1>
        <div className="mt-4">
          <EmptyState
            icon={<ShoppingCart className="size-6" />}
            title="Корзина пуста"
            text="Добавьте товары из каталога — они автоматически сгруппируются по поставщикам."
            action={
              <>
                <LinkButton to="/catalog">Перейти в каталог</LinkButton>
                <LinkButton to="/favorites" variant="secondary">
                  Шаблоны закупок
                </LinkButton>
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px]">Корзина</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {withCount(groups.length, 'поставщик', 'поставщика', 'поставщиков')} ·{' '}
            {withCount(state.cart.length, 'позиция', 'позиции', 'позиций')} · каждая группа
            оформляется отдельной заявкой
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<BookmarkPlus className="size-3.5" />}
            onClick={() => setTemplateOpen(true)}
          >
            Сохранить как шаблон
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="size-3.5" />}
            onClick={() => {
              dispatch({ type: 'cart/clear' });
              toast.info('Корзина очищена');
            }}
          >
            Очистить корзину
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {groups.map((group) => {
            const isSelected = activeSelection.includes(group.supplier.id);
            return (
              <section key={group.supplier.id} className="card overflow-hidden">
                <header className="flex flex-wrap items-center gap-3 border-b border-ink-100 bg-ink-50 p-4">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleGroup(group.supplier.id)}
                    className="shrink-0"
                  />
                  <SupplierLogo
                    name={group.supplier.name}
                    hue={group.supplier.hue}
                    className="size-10"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/suppliers/${group.supplier.id}`}
                      className="text-sm font-bold text-ink-900 hover:text-brand-700"
                    >
                      {group.supplier.name}
                    </Link>
                    <p className="text-xs text-ink-500">
                      Доставка: {deliveryDaysLabel(group.supplier)} · ближайшая{' '}
                      {relativeDay(group.nearestDelivery)} · мин. заказ{' '}
                      {money(group.supplier.minOrder)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-bold text-ink-900">{money(group.goodsTotal)}</p>
                    <p className="text-xs text-ink-500">
                      {group.deliveryFee === 0
                        ? 'доставка бесплатно'
                        : `+ доставка ${money(group.deliveryFee)}`}
                    </p>
                  </div>
                </header>

                {!group.meetsMinOrder && (
                  <div className="flex items-start gap-2 border-b border-warn-100 bg-warn-50 px-4 py-2.5 text-[13px] text-warn-600">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <span>
                      До минимальной суммы заказа не хватает{' '}
                      <strong>{money(group.minOrderGap)}</strong>. Добавьте позиции или снимите
                      выбор с этой группы.{' '}
                      <Link
                        to={`/suppliers/${group.supplier.id}`}
                        className="font-semibold underline"
                      >
                        Смотреть каталог поставщика
                      </Link>
                    </span>
                  </div>
                )}

                <ul className="divide-y divide-ink-100">
                  {group.lines.map((line) => (
                    <li key={line.product.id} className="flex flex-wrap items-center gap-3 p-4">
                      <Link to={`/product/${line.product.id}`} className="shrink-0">
                        <ProductImage product={line.product} className="size-16" />
                      </Link>
                      <div className="min-w-[180px] flex-1">
                        <Link
                          to={`/product/${line.product.id}`}
                          className="text-[13px] font-medium text-ink-900 hover:text-brand-700"
                        >
                          {line.product.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {line.product.packSize} · арт. {line.product.article}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {money(line.product.price)} за {formatQty(1, line.product.unit)}
                        </p>
                        {line.exceedsStock && (
                          <p className="mt-1 text-xs font-medium text-danger-600">
                            У поставщика доступно {formatQty(line.product.stock, line.product.unit)}
                          </p>
                        )}
                      </div>
                      <QtyStepper
                        value={line.qty}
                        onChange={(next) => cart.setQty(line.product.id, next)}
                        unit={line.product.unit}
                        min={line.product.minQty}
                        step={line.product.step}
                        size="sm"
                      />
                      <p className="w-24 text-right text-sm font-semibold text-ink-900">
                        {money(line.total)}
                      </p>
                      <button
                        type="button"
                        onClick={() => cart.remove(line.product.id)}
                        className="cursor-pointer p-1 text-ink-400 hover:text-danger-600"
                        aria-label="Удалить позицию"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      dispatch({
                        type: 'cart/removeSupplier',
                        productIds: group.lines.map((l) => l.product.id),
                      })
                    }
                  >
                    Убрать группу
                  </Button>
                  <Button
                    size="sm"
                    disabled={!group.meetsMinOrder}
                    icon={<ArrowRight className="size-3.5" />}
                    onClick={() => navigate(`/checkout?suppliers=${group.supplier.id}`)}
                  >
                    Оформить у этого поставщика
                  </Button>
                </footer>
              </section>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-4">
            <h2 className="text-[15px]">Итого по выбранным</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Поставщиков</dt>
                <dd className="font-medium text-ink-900">{selectedGroups.length}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Позиций</dt>
                <dd className="font-medium text-ink-900">{positions}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Товары</dt>
                <dd className="font-medium text-ink-900">{money(goodsTotal)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-500">Доставка</dt>
                <dd className="font-medium text-ink-900">
                  {deliveryTotal === 0 ? 'бесплатно' : money(deliveryTotal)}
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
              <span className="text-sm font-semibold text-ink-900">К оплате</span>
              <span className="text-[22px] font-bold text-ink-900">
                {money(goodsTotal + deliveryTotal)}
              </span>
            </div>

            {blockedGroups.length > 0 && (
              <p className="mt-3 rounded-lg bg-warn-50 p-2.5 text-xs text-warn-600">
                {withCount(blockedGroups.length, 'группа', 'группы', 'групп')} не добрала
                минимальную сумму — они не попадут в заявки.
              </p>
            )}

            <Button
              block
              size="lg"
              className="mt-3"
              disabled={readyGroups.length === 0}
              onClick={() =>
                navigate(
                  `/checkout?suppliers=${readyGroups.map((g) => g.supplier.id).join(',')}`,
                )
              }
            >
              Оформить {readyGroups.length > 1 ? `${readyGroups.length} заявки` : 'заявку'}
            </Button>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
              <Truck className="size-3.5" />
              По одной заявке на каждого поставщика — со своей датой доставки
            </p>
          </div>

          <div className="card mt-3 p-4">
            <p className="text-[13px] font-semibold text-ink-900">Разбивка по поставщикам</p>
            <ul className="mt-2 space-y-1.5">
              {groups.map((group) => (
                <li key={group.supplier.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="truncate text-ink-600">{group.supplier.name}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="font-medium text-ink-900">{money(group.total)}</span>
                    {!group.meetsMinOrder && (
                      <Badge tone="warn" size="sm">
                        мин.
                      </Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <Modal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        title="Сохранить корзину как шаблон"
        description="Шаблон можно применить одним нажатием при следующей закупке"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTemplateOpen(false)}>
              Отмена
            </Button>
            <Button onClick={saveTemplate}>Сохранить</Button>
          </>
        }
      >
        <Field label="Название шаблона">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Например: Недельная закупка — Покровка"
          />
        </Field>
      </Modal>
    </div>
  );
}
