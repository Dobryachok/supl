import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  MapPin,
  MessageSquare,
  PackageCheck,
  Phone,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { Tabs } from '@/components/ui/Tabs';
import { DeliveryTrackerMini } from '@/components/orders/DeliveryTracker';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useChatActions } from '@/hooks/useChatActions';
import { cn } from '@/lib/cn';
import {
  dateFull,
  daysBetween,
  isoDate,
  money,
  relativeDay,
  startOfToday,
  weekday,
  withCount,
} from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { isOverdue, orderTotals } from '@/store/selectors';
import type { Order } from '@/types';

type Filter = 'upcoming' | 'today' | 'week' | 'acceptance' | 'closed';

const trackedStatuses: Order['status'][] = ['sent', 'confirmed', 'shipped', 'delivered'];
const closedStatuses: Order['status'][] = ['accepted', 'partially_accepted', 'refused'];

export function DeliveriesPage() {
  const state = useAppState();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const today = isoDate(startOfToday());

  const tracked = useMemo(
    () =>
      state.orders
        .filter((o) => trackedStatuses.includes(o.status))
        .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate)),
    [state.orders],
  );

  const counters = {
    upcoming: tracked.length,
    today: tracked.filter((o) => o.deliveryDate === today).length,
    week: tracked.filter((o) => {
      const diff = daysBetween(o.deliveryDate);
      return diff >= 0 && diff <= 7;
    }).length,
    acceptance: tracked.filter((o) => o.status === 'delivered').length,
    closed: state.orders.filter((o) => closedStatuses.includes(o.status)).length,
  };

  const visible = useMemo(() => {
    switch (filter) {
      case 'today':
        return tracked.filter((o) => o.deliveryDate === today);
      case 'week':
        return tracked.filter((o) => {
          const diff = daysBetween(o.deliveryDate);
          return diff >= 0 && diff <= 7;
        });
      case 'acceptance':
        return tracked.filter((o) => o.status === 'delivered');
      case 'closed':
        return state.orders
          .filter((o) => closedStatuses.includes(o.status))
          .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate));
      case 'upcoming':
      default:
        return tracked;
    }
  }, [filter, tracked, state.orders, today]);

  const groups = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of visible) {
      const list = map.get(order.deliveryDate) ?? [];
      list.push(order);
      map.set(order.deliveryDate, list);
    }
    return Array.from(map.entries());
  }, [visible]);

  const inTransit = tracked.filter((o) => o.status === 'shipped');
  const overdueList = tracked.filter(isOverdue);
  const amountToday = tracked
    .filter((o) => o.deliveryDate === today)
    .reduce((sum, o) => sum + orderTotals(o).total, 0);

  return (
    <div className="page pt-5">
      <p className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
        График поставок
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px]">Мои поставки</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Что и когда приедет на точки, где машина сейчас и что ждёт приёмки на складе
          </p>
        </div>
        <LinkButton to="/orders" variant="secondary">
          Все заявки
        </LinkButton>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          icon={<CalendarDays className="size-4" />}
          label="Сегодня"
          value={withCount(counters.today, 'поставка', 'поставки', 'поставок')}
          hint={amountToday > 0 ? `на ${money(amountToday)}` : 'на сегодня пусто'}
          onClick={() => setFilter('today')}
        />
        <SummaryTile
          icon={<Truck className="size-4" />}
          label="В пути"
          value={withCount(inTransit.length, 'машина', 'машины', 'машин')}
          hint={
            inTransit[0]
              ? `ближайшая — ${inTransit[0].supplierName}`
              : 'все поставки на складе или в сборке'
          }
          tone="progress"
        />
        <SummaryTile
          icon={<PackageCheck className="size-4" />}
          label="Ждут приёмки"
          value={withCount(counters.acceptance, 'поставка', 'поставки', 'поставок')}
          hint="проверьте количество и качество"
          tone={counters.acceptance > 0 ? 'warn' : 'neutral'}
          onClick={() => setFilter('acceptance')}
        />
        <SummaryTile
          icon={<AlertTriangle className="size-4" />}
          label="Просрочено"
          value={withCount(overdueList.length, 'заявка', 'заявки', 'заявок')}
          hint={overdueList.length ? 'свяжитесь с поставщиком' : 'срывов нет'}
          tone={overdueList.length ? 'danger' : 'neutral'}
        />
      </div>

      <Tabs
        className="mt-5"
        variant="pills"
        value={filter}
        onChange={(next) => setFilter(next as Filter)}
        items={[
          { id: 'upcoming', label: 'Все активные', count: counters.upcoming },
          { id: 'today', label: 'Сегодня', count: counters.today },
          { id: 'week', label: 'Неделя', count: counters.week },
          { id: 'acceptance', label: 'Ждут приёмки', count: counters.acceptance },
          { id: 'closed', label: 'Завершённые', count: counters.closed },
        ]}
      />

      {groups.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<Truck className="size-6" />}
          title="Поставок в этой выборке нет"
          text="Оформите заявку в каталоге — она появится здесь с трекингом по этапам."
          action={<LinkButton to="/catalog">Собрать заявку</LinkButton>}
        />
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map(([date, orders]) => (
            <section key={date}>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px]">
                  {dateFull(date)}, {weekday(date)}
                </h2>
                <Badge tone={date === today ? 'info' : 'neutral'}>{relativeDay(date)}</Badge>
                <span className="text-[13px] text-ink-500">
                  {withCount(orders.length, 'поставка', 'поставки', 'поставок')}
                </span>
              </div>
              <div className="mt-2 space-y-2.5">
                {orders.map((order) => (
                  <DeliveryCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  hint,
  tone = 'neutral',
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  tone?: 'neutral' | 'progress' | 'warn' | 'danger';
  onClick?: () => void;
}) {
  const tones = {
    neutral: 'text-ink-500 bg-ink-100',
    progress: 'text-frost-500 bg-frost-50',
    warn: 'text-warn-600 bg-warn-50',
    danger: 'text-danger-600 bg-danger-50',
  };
  return (
    <div
      onClick={onClick}
      className={cn('card p-4', onClick && 'cursor-pointer hover:border-brand-300')}
    >
      <div className="flex items-center gap-2">
        <span className={cn('flex size-7 items-center justify-center rounded-lg', tones[tone])}>
          {icon}
        </span>
        <p className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">{label}</p>
      </div>
      <p className="mt-2 text-[17px] font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{hint}</p>
    </div>
  );
}

function DeliveryCard({ order }: { order: Order }) {
  const state = useAppState();
  const chat = useChatActions();
  const navigate = useNavigate();
  const supplier = state.suppliers.find((s) => s.id === order.supplierId);
  const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId);
  const totals = orderTotals(order);
  const overdue = isOverdue(order);

  return (
    <article
      className={cn(
        'card p-4 transition-shadow hover:shadow-hover',
        overdue && 'border-danger-100',
        order.status === 'delivered' && 'border-warn-100',
      )}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[2.75rem_minmax(0,1fr)_13.75rem_9.375rem] lg:items-start lg:gap-4">
        {supplier && (
          <SupplierLogo
            name={supplier.name}
            hue={supplier.hue}
            className="size-11 sm:col-start-1 sm:row-start-1 lg:col-start-1 lg:row-start-1"
          />
        )}
        <div className="min-w-0 sm:col-start-2 sm:row-start-1 lg:col-start-2 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/orders/${order.id}`}
              className="text-sm font-bold text-ink-900 hover:text-brand-700"
            >
              {order.number}
            </Link>
            <StatusBadge status={order.status} size="sm" />
            {overdue && (
              <Badge tone="danger" size="sm" icon={<AlertTriangle className="size-3" />}>
                Просрочена
              </Badge>
            )}
          </div>
          <Link
            to={`/suppliers/${order.supplierId}`}
            className="mt-0.5 block text-[13px] text-ink-600 hover:text-brand-600"
          >
            {order.supplierName}
          </Link>
          <p className="mt-1 text-xs text-ink-500">
            {withCount(order.lines.length, 'позиция', 'позиции', 'позиций')} ·{' '}
            {order.lines
              .slice(0, 2)
              .map((l) => l.name)
              .join(', ')}
            {order.lines.length > 2 ? ` и ещё ${order.lines.length - 2}` : ''}
          </p>
        </div>

        <dl className="space-y-1 text-[13px] sm:col-span-2 sm:row-start-2 lg:col-span-1 lg:col-start-3 lg:row-start-1">
          <div className="grid grid-cols-[0.875rem_minmax(0,1fr)] items-center gap-x-1.5 text-ink-700">
            <Clock className="size-3.5 text-ink-400" />
            <span>{order.deliveryWindow}</span>
          </div>
          <div className="grid grid-cols-[0.875rem_minmax(0,1fr)] items-start gap-x-1.5 text-ink-600">
            <MapPin className="mt-0.5 size-3.5 text-ink-400" />
            <span>
              {outlet?.name}
              <span className="block text-xs text-ink-500">{order.deliveryAddress}</span>
            </span>
          </div>
          {supplier && (
            <div className="grid grid-cols-[0.875rem_minmax(0,1fr)] items-center gap-x-1.5 text-ink-600">
              <Phone className="size-3.5 text-ink-400" />
              <span>{supplier.contacts.phone}</span>
            </div>
          )}
        </dl>

        <div className="sm:col-span-2 sm:row-start-3 sm:text-left lg:col-start-4 lg:row-start-1 lg:text-right">
          <p className="text-[17px] font-bold text-ink-900">{money(totals.factTotal)}</p>
          <p className="text-xs text-ink-500">
            {order.deliveryFee === 0 ? 'доставка бесплатно' : `доставка ${money(order.deliveryFee)}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:justify-start lg:justify-end">
            {order.status === 'delivered' ? (
              <LinkButton
                to={`/orders/${order.id}/acceptance`}
                size="sm"
                icon={<PackageCheck className="size-3.5" />}
              >
                Принять
              </LinkButton>
            ) : (
              <LinkButton to={`/orders/${order.id}`} size="sm" variant="secondary">
                Открыть
              </LinkButton>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={<MessageSquare className="size-3.5" />}
              onClick={() => {
                const threadId = chat.ensureThread({
                  supplierId: order.supplierId,
                  orderId: order.id,
                  subject: `Заявка ${order.number}`,
                });
                navigate(`/chats?thread=${threadId}`);
              }}
            >
              Чат
            </Button>
          </div>
        </div>
      </div>

      <DeliveryTrackerMini order={order} className="mt-3" />
    </article>
  );
}
