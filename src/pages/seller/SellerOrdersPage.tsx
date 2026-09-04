import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { TD, TH, THead, TR, Table } from '@/components/ui/Table';
import { Tabs } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { cn } from '@/lib/cn';
import { dateShort, isoDate, money, relativeDay, startOfToday } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import { isOverdue, orderTotals, sellerOrders } from '@/store/selectors';
import type { OrderStatus } from '@/types';

const tabs: { id: string; label: string; statuses: OrderStatus[] }[] = [
  { id: 'new', label: 'Новые', statuses: ['sent'] },
  { id: 'work', label: 'В работе', statuses: ['confirmed', 'shipped'] },
  { id: 'delivered', label: 'Доставлены', statuses: ['delivered'] },
  {
    id: 'closed',
    label: 'Закрытые',
    statuses: ['accepted', 'partially_accepted', 'refused', 'rejected', 'cancelled'],
  },
];

export function SellerOrdersPage() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const loading = useSimulatedLoad([state.session.sellerSupplierId]);
  const statusParam = searchParams.get('status') as OrderStatus | null;
  const [tab, setTab] = useState(
    statusParam ? (tabs.find((t) => t.statuses.includes(statusParam))?.id ?? 'all') : 'new',
  );
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'created' | 'delivery'>('delivery');

  const orders = sellerOrders(state);
  const today = isoDate(startOfToday());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const statuses = tabs.find((t) => t.id === tab)?.statuses;
    return orders
      .filter((order) => {
        if (statuses && !statuses.includes(order.status)) return false;
        if (q) {
          const haystack = `${order.number} ${order.lines.map((l) => l.name).join(' ')}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) =>
        sort === 'delivery'
          ? a.deliveryDate.localeCompare(b.deliveryDate)
          : b.createdAt.localeCompare(a.createdAt),
      );
  }, [orders, tab, query, sort]);

  const advance = (orderId: string, status: OrderStatus, comment: string) =>
    dispatch({ type: 'orders/advance', orderId, status, actor: 'seller', comment });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px]">Заявки от ресторанов</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Подтверждайте состав, назначайте машину и отмечайте статусы доставки
          </p>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Номер заявки или товар"
          leading={<Search className="size-4" />}
          className="w-full sm:w-72"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          variant="pills"
          items={[
            ...tabs.map((item) => ({
              id: item.id,
              label: item.label,
              count: orders.filter((o) => item.statuses.includes(o.status)).length,
            })),
            { id: 'all', label: 'Все', count: orders.length },
          ]}
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'created' | 'delivery')}
          className="ml-auto h-9 w-52 text-[13px]"
        >
          <option value="delivery">Сортировка: по дате доставки</option>
          <option value="created">Сортировка: по дате создания</option>
        </Select>
      </div>

      <div className="mt-4">
        {loading ? (
          <RowsSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            title="Заявок в этой вкладке нет"
            text="Переключите вкладку или дождитесь новых заявок от ресторанов."
            compact
          />
        ) : (
          <div className="card overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH width="16%">Заявка</TH>
                  <TH width="20%">Заказчик</TH>
                  <TH>Состав</TH>
                  <TH width="15%">Доставка</TH>
                  <TH width="11%" align="right">
                    Сумма
                  </TH>
                  <TH width="24%">Статус и действия</TH>
                </TR>
              </THead>
              <tbody>
                {filtered.map((order) => {
                  const totals = orderTotals(order);
                  const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId);
                  const overdue = isOverdue(order);
                  return (
                    <TR key={order.id}>
                      <TD>
                        <Link
                          to={`/seller/orders/${order.id}`}
                          className="text-[13px] font-semibold text-brand-700 hover:underline"
                        >
                          {order.number}
                        </Link>
                        <p className="text-xs text-ink-500">от {dateShort(order.createdAt)}</p>
                      </TD>
                      <TD>
                        <p className="text-[13px] font-medium text-ink-900">
                          {state.restaurant.name}
                        </p>
                        <p className="truncate text-xs text-ink-500">{outlet?.name}</p>
                      </TD>
                      <TD>
                        <p className="line-clamp-1 text-[13px] text-ink-700">
                          {order.lines[0]?.name}
                        </p>
                        {order.lines.length > 1 && (
                          <p className="text-xs text-ink-500">ещё {order.lines.length - 1}</p>
                        )}
                      </TD>
                      <TD>
                        <p
                          className={cn(
                            'text-[13px] font-semibold',
                            overdue
                              ? 'text-danger-600'
                              : order.deliveryDate === today
                                ? 'text-success-600'
                                : 'text-ink-800',
                          )}
                        >
                          {dateShort(order.deliveryDate)}
                        </p>
                        <p className="text-xs text-ink-500">
                          {relativeDay(order.deliveryDate)}, {order.deliveryWindow}
                        </p>
                      </TD>
                      <TD align="right" className="text-[13px] font-semibold text-ink-900">
                        {money(totals.total)}
                      </TD>
                      <TD>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={order.status} size="sm" />
                          {order.status === 'sent' && (
                            <Button
                              size="sm"
                              onClick={() =>
                                advance(order.id, 'confirmed', 'Заявка подтверждена поставщиком')
                              }
                            >
                              Подтвердить
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => advance(order.id, 'shipped', 'Машина вышла в рейс')}
                            >
                              Отгрузить
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => advance(order.id, 'delivered', 'Доставлено на склад')}
                            >
                              Доставлено
                            </Button>
                          )}
                          {order.status === 'delivered' && (
                            <span className="text-xs text-ink-500">ждём приёмку</span>
                          )}
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
