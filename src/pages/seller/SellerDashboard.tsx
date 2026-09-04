import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  PackageCheck,
  PackageX,
  ShoppingBag,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { cn } from '@/lib/cn';
import { dateShort, isoDate, money, relativeDay, startOfToday, withCount } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { orderTotals, productsOfSupplier, sellerOrders } from '@/store/selectors';

export function SellerDashboard() {
  const state = useAppState();
  const dispatch = useDispatch();
  const loading = useSimulatedLoad([state.session.sellerSupplierId]);
  const supplier = state.suppliers.find((s) => s.id === state.session.sellerSupplierId);
  const orders = sellerOrders(state);
  const today = isoDate(startOfToday());

  const newOrders = orders.filter((o) => o.status === 'sent');
  const todayShipments = orders.filter(
    (o) => o.deliveryDate === today && ['confirmed', 'shipped', 'delivered'].includes(o.status),
  );
  const inTransit = orders.filter((o) => o.status === 'shipped');
  const awaitingAcceptance = orders.filter((o) => o.status === 'delivered');
  const closed = orders.filter((o) =>
    ['accepted', 'partially_accepted'].includes(o.status),
  );
  const revenue = closed.reduce((sum, o) => sum + orderTotals(o).factTotal, 0);
  const products = productsOfSupplier(state, state.session.sellerSupplierId);
  const outOfStock = products.filter((p) => p.stock <= 0 || p.stock < p.minQty);
  const acts = state.acts.filter((a) => a.supplierId === state.session.sellerSupplierId);

  const tiles = [
    {
      label: 'Новые заявки',
      value: newOrders.length,
      hint: newOrders.length ? 'ждут подтверждения' : 'всё обработано',
      icon: ShoppingBag,
      tone: newOrders.length ? 'text-danger-600' : 'text-ink-400',
      to: '/seller/orders?status=sent',
    },
    {
      label: 'Отгрузки сегодня',
      value: todayShipments.length,
      hint: `${inTransit.length} в пути · ${awaitingAcceptance.length} ждут приёмки`,
      icon: Truck,
      tone: 'text-brand-600',
      to: '/seller/deliveries',
    },
    {
      label: 'Выручка по закрытым',
      value: money(revenue),
      hint: withCount(closed.length, 'заявка', 'заявки', 'заявок'),
      icon: TrendingUp,
      tone: 'text-success-600',
      to: '/seller/orders?status=accepted',
    },
    {
      label: 'Товары без остатка',
      value: outOfStock.length,
      hint: `${products.length} позиций в каталоге`,
      icon: PackageX,
      tone: outOfStock.length ? 'text-warn-600' : 'text-ink-400',
      to: '/seller/products',
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px]">Дашборд поставщика</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {supplier?.legalName} · рейтинг {supplier?.rating} ·{' '}
            {withCount(supplier?.reviewsCount ?? 0, 'отзыв', 'отзыва', 'отзывов')}
          </p>
        </div>
        <LinkButton to="/seller/products/new">Добавить товар</LinkButton>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} to={tile.to} className="card p-4 hover:shadow-[var(--shadow-hover)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] tracking-wide text-ink-500 uppercase">{tile.label}</p>
              <tile.icon className={cn('size-4', tile.tone)} />
            </div>
            <p className="mt-2 text-[24px] leading-none font-bold text-ink-900">{tile.value}</p>
            <p className="mt-1.5 text-xs text-ink-500">{tile.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-100 p-4">
            <h2 className="text-[15px]">Новые заявки</h2>
            <Link
              to="/seller/orders"
              className="flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:underline"
            >
              Все заявки
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="p-4">
              <RowsSkeleton count={3} />
            </div>
          ) : newOrders.length === 0 ? (
            <EmptyState
              title="Новых заявок нет"
              text="Как только ресторан отправит заявку, она появится здесь."
              compact
              className="m-4 border-0"
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {newOrders.map((order) => {
                const totals = orderTotals(order);
                return (
                  <li key={order.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/seller/orders/${order.id}`}
                        className="text-[13px] font-semibold text-brand-700 hover:underline"
                      >
                        {order.number}
                      </Link>
                      <p className="text-xs text-ink-500">
                        {state.restaurant.name} · {order.lines.length} позиций ·{' '}
                        {money(totals.total)}
                      </p>
                      <p className="text-xs text-ink-500">
                        Доставка {dateShort(order.deliveryDate)} ({relativeDay(order.deliveryDate)}),{' '}
                        {order.deliveryWindow}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          dispatch({
                            type: 'orders/advance',
                            orderId: order.id,
                            status: 'confirmed',
                            actor: 'seller',
                            comment: 'Заявка подтверждена, машина назначена',
                          })
                        }
                      >
                        Подтвердить
                      </Button>
                      <LinkButton to={`/seller/orders/${order.id}`} size="sm" variant="secondary">
                        Открыть
                      </LinkButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="flex items-center gap-2 text-[15px]">
              <Truck className="size-4 text-ink-400" />
              Отгрузки сегодня
              <Link
                to="/seller/deliveries"
                className="ml-auto text-[13px] font-medium text-brand-600 hover:underline"
              >
                План
              </Link>
            </h2>
            {todayShipments.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-500">На сегодня отгрузок нет.</p>
            ) : (
              <ul className="mt-2 divide-y divide-ink-100">
                {todayShipments.map((order) => (
                  <li key={order.id} className="flex items-center gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/seller/orders/${order.id}`}
                        className="text-[13px] font-medium text-ink-900 hover:text-brand-700"
                      >
                        {order.number}
                      </Link>
                      <p className="truncate text-xs text-ink-500">{order.deliveryAddress}</p>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {awaitingAcceptance.length > 0 && (
            <div className="card p-4">
              <h2 className="flex items-center gap-2 text-[15px]">
                <PackageCheck className="size-4 text-frost-500" />
                Ждут приёмки на складе
              </h2>
              <ul className="mt-2 divide-y divide-ink-100">
                {awaitingAcceptance.map((order) => (
                  <li key={order.id} className="flex items-center gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/seller/orders/${order.id}`}
                        className="text-[13px] font-medium text-ink-900 hover:text-brand-700"
                      >
                        {order.number}
                      </Link>
                      <p className="text-xs text-ink-500">
                        доставлено {relativeDay(order.deliveryDate)} · {money(orderTotals(order).total)}
                      </p>
                    </div>
                    <Badge tone="progress" size="sm">
                      на проверке
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-4">
            <h2 className="flex items-center gap-2 text-[15px]">
              <ClipboardCheck className="size-4 text-warn-500" />
              Акты расхождений
            </h2>
            {acts.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-500">Претензий по поставкам нет.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {acts.map((act) => (
                  <li key={act.id} className="rounded-lg bg-warn-50 p-2.5">
                    <p className="text-[13px] font-semibold text-warn-600">{act.number}</p>
                    <p className="text-xs text-ink-600">
                      {act.orderNumber} · расхождение {money(act.discrepancyAmount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {outOfStock.length > 0 && (
            <div className="card p-4">
              <h2 className="flex items-center gap-2 text-[15px]">
                <AlertTriangle className="size-4 text-danger-500" />
                Требуют внимания
              </h2>
              <ul className="mt-2 space-y-1.5">
                {outOfStock.slice(0, 5).map((product) => (
                  <li key={product.id} className="flex items-center gap-2 text-[13px]">
                    <Link
                      to={`/seller/products/${product.id}/edit`}
                      className="min-w-0 flex-1 truncate text-ink-700 hover:text-brand-700"
                    >
                      {product.name}
                    </Link>
                    <Badge tone="danger" size="sm">
                      {product.stock <= 0 ? 'нет' : `${product.stock}`}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
