import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  PackageCheck,
  Phone,
  Truck,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { DeliveryTrackerMini } from '@/components/orders/DeliveryTracker';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useChatActions } from '@/hooks/useChatActions';
import { useOrderFlow } from '@/hooks/useOrderFlow';
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
import { isOverdue, orderTotals, sellerOrders } from '@/store/selectors';
import type { Order } from '@/types';

type Filter = 'plan' | 'today' | 'transit' | 'acceptance' | 'closed';

export function SellerDeliveriesPage() {
  const state = useAppState();
  const [filter, setFilter] = useState<Filter>('plan');
  const today = isoDate(startOfToday());

  const orders = useMemo(
    () => sellerOrders(state).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate)),
    [state],
  );

  const toShip = orders.filter((o) => o.status === 'confirmed');
  const transit = orders.filter((o) => o.status === 'shipped');
  const awaiting = orders.filter((o) => o.status === 'delivered');
  const active = orders.filter((o) =>
    ['sent', 'confirmed', 'shipped', 'delivered'].includes(o.status),
  );
  const closed = orders.filter((o) =>
    ['accepted', 'partially_accepted', 'refused'].includes(o.status),
  );
  const overdueList = active.filter(isOverdue);
  const todayList = active.filter((o) => o.deliveryDate === today);

  const visible = useMemo(() => {
    switch (filter) {
      case 'today':
        return todayList;
      case 'transit':
        return transit;
      case 'acceptance':
        return awaiting;
      case 'closed':
        return [...closed].sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate));
      case 'plan':
      default:
        return active;
    }
  }, [filter, active, todayList, transit, awaiting, closed]);

  const groups = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of visible) {
      const list = map.get(order.deliveryDate) ?? [];
      list.push(order);
      map.set(order.deliveryDate, list);
    }
    return Array.from(map.entries());
  }, [visible]);

  const weekAmount = active
    .filter((o) => {
      const diff = daysBetween(o.deliveryDate);
      return diff >= 0 && diff <= 7;
    })
    .reduce((sum, o) => sum + orderTotals(o).total, 0);

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
        Логистика
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px]">План отгрузок</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Что собрать и отвезти по дням, статусы машин и поставки, ждущие приёмки
          </p>
        </div>
        <LinkButton to="/seller/orders" variant="secondary">
          Все заявки
        </LinkButton>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          icon={<CalendarDays className="size-4" />}
          label="Отгрузки сегодня"
          value={withCount(todayList.length, 'поставка', 'поставки', 'поставок')}
          hint={`к сборке ${withCount(toShip.length, 'заявка', 'заявки', 'заявок')}`}
          onClick={() => setFilter('today')}
        />
        <Tile
          icon={<Truck className="size-4" />}
          label="В пути"
          value={withCount(transit.length, 'машина', 'машины', 'машин')}
          hint="ждём подтверждения доставки"
          tone="progress"
          onClick={() => setFilter('transit')}
        />
        <Tile
          icon={<PackageCheck className="size-4" />}
          label="Ждут приёмки"
          value={withCount(awaiting.length, 'поставка', 'поставки', 'поставок')}
          hint="склад ресторана проверяет"
          tone={awaiting.length ? 'warn' : 'neutral'}
          onClick={() => setFilter('acceptance')}
        />
        <Tile
          icon={<AlertTriangle className="size-4" />}
          label="Просрочено"
          value={withCount(overdueList.length, 'заявка', 'заявки', 'заявок')}
          hint={`план на неделю ${money(weekAmount)}`}
          tone={overdueList.length ? 'danger' : 'neutral'}
        />
      </div>

      <Tabs
        className="mt-5"
        variant="pills"
        value={filter}
        onChange={(next) => setFilter(next as Filter)}
        items={[
          { id: 'plan', label: 'Все активные', count: active.length },
          { id: 'today', label: 'Сегодня', count: todayList.length },
          { id: 'transit', label: 'В пути', count: transit.length },
          { id: 'acceptance', label: 'Ждут приёмки', count: awaiting.length },
          { id: 'closed', label: 'Закрытые', count: closed.length },
        ]}
      />

      {groups.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<Truck className="size-6" />}
          title="Поставок в этой выборке нет"
          text="Подтверждённые заявки автоматически попадают в план отгрузок."
          action={<LinkButton to="/seller/orders">Открыть заявки</LinkButton>}
        />
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map(([date, list]) => (
            <section key={date}>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px]">
                  {dateFull(date)}, {weekday(date)}
                </h2>
                <Badge tone={date === today ? 'info' : 'neutral'}>{relativeDay(date)}</Badge>
                <span className="text-[13px] text-ink-500">
                  {money(list.reduce((sum, o) => sum + orderTotals(o).total, 0))}
                </span>
              </div>
              <div className="mt-2 space-y-2.5">
                {list.map((order) => (
                  <ShipmentCard key={order.id} order={order} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Tile({
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

function ShipmentCard({ order }: { order: Order }) {
  const state = useAppState();
  const flow = useOrderFlow();
  const chat = useChatActions();
  const navigate = useNavigate();
  const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId);
  const totals = orderTotals(order);
  const overdue = isOverdue(order);

  return (
    <article
      className={cn(
        'card p-4 transition-shadow hover:shadow-hover',
        overdue && 'border-danger-100',
        order.status === 'sent' && 'border-brand-200',
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-[190px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/seller/orders/${order.id}`}
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
          <p className="mt-0.5 text-[13px] text-ink-700">{state.restaurant.name}</p>
          <p className="mt-1 text-xs text-ink-500">
            {withCount(order.lines.length, 'позиция', 'позиции', 'позиций')} ·{' '}
            {order.lines
              .slice(0, 2)
              .map((l) => l.name)
              .join(', ')}
            {order.lines.length > 2 ? ` и ещё ${order.lines.length - 2}` : ''}
          </p>
        </div>

        <dl className="min-w-[190px] space-y-1 text-[13px]">
          <div className="flex items-center gap-1.5 text-ink-700">
            <Clock className="size-3.5 text-ink-400" />
            {order.deliveryWindow}
          </div>
          <div className="flex items-start gap-1.5 text-ink-600">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-400" />
            <span>
              {outlet?.name}
              <span className="block text-xs text-ink-500">{order.deliveryAddress}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-600">
            <User className="size-3.5 text-ink-400" />
            {outlet?.contactName}
          </div>
          <div className="flex items-center gap-1.5 text-ink-600">
            <Phone className="size-3.5 text-ink-400" />
            {outlet?.phone}
          </div>
        </dl>

        <div className="min-w-[170px] text-right">
          <p className="text-[17px] font-bold text-ink-900">{money(totals.factTotal)}</p>
          <p className="text-xs text-ink-500">
            {order.deliveryFee === 0 ? 'доставка бесплатно' : `доставка ${money(order.deliveryFee)}`}
          </p>
          <div className="mt-2 flex flex-wrap justify-end gap-1.5">
            {order.status === 'sent' && (
              <Button
                size="sm"
                icon={<CheckCircle2 className="size-3.5" />}
                onClick={() => flow.confirm(order)}
              >
                Подтвердить
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button
                size="sm"
                icon={<Truck className="size-3.5" />}
                onClick={() => flow.ship(order)}
              >
                Отправить
              </Button>
            )}
            {order.status === 'shipped' && (
              <Button
                size="sm"
                variant="success"
                icon={<PackageCheck className="size-3.5" />}
                onClick={() => flow.deliver(order)}
              >
                Доставлено
              </Button>
            )}
            {order.status === 'delivered' && <Badge tone="progress">Ждём приёмку</Badge>}
            <LinkButton to={`/seller/orders/${order.id}`} size="sm" variant="secondary">
              Заявка
            </LinkButton>
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
                navigate(`/seller/chats?thread=${threadId}`);
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
