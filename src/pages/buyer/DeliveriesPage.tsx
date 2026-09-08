import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  LayoutList,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { DeliveryCalendar } from '@/components/deliveries/DeliveryCalendar';
import {
  DeliveryCalendarFilters,
} from '@/components/deliveries/DeliveryCalendarFilters';
import { DeliveryDayPanel } from '@/components/deliveries/DeliveryDayPanel';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeliveryCard } from '@/components/orders/DeliveryCard';
import { Tabs } from '@/components/ui/Tabs';
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
import {
  type DeliveryCalendarFilters as CalendarFilters,
  deliveriesByDate,
  deliveryClosedStatuses,
  emptyDeliveryCalendarFilters,
  filterDeliveries,
  isOverdue,
  orderTotals,
  trackedStatuses,
} from '@/store/selectors';
import type { Order } from '@/types';

type ListFilter = 'upcoming' | 'today' | 'week' | 'acceptance' | 'closed';
type PageView = 'calendar' | 'list';

const closedStatuses: Order['status'][] = ['accepted', 'partially_accepted', 'refused'];

export function DeliveriesPage() {
  const state = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();

  const today = isoDate(startOfToday());
  const view: PageView = searchParams.get('view') === 'list' ? 'list' : 'calendar';
  const selectedDate = searchParams.get('date') ?? today;

  const [visibleMonth, setVisibleMonth] = useState(`${selectedDate.slice(0, 7)}-01`);
  const [listFilter, setListFilter] = useState<ListFilter>('upcoming');
  const [calendarFilters, setCalendarFilters] = useState<CalendarFilters>(emptyDeliveryCalendarFilters);

  const setView = (next: PageView) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('view', next);
      if (!params.get('date')) params.set('date', today);
      return params;
    });
  };

  const setSelectedDate = (iso: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('date', iso);
      params.set('view', 'calendar');
      return params;
    });
    setVisibleMonth(`${iso.slice(0, 7)}-01`);
  };

  const tracked = useMemo(
    () =>
      state.orders
        .filter((o) => trackedStatuses.includes(o.status))
        .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate)),
    [state.orders],
  );

  const filteredCalendarOrders = useMemo(
    () => filterDeliveries(state, calendarFilters),
    [state, calendarFilters],
  );

  const calendarByDate = useMemo(
    () => deliveriesByDate(filteredCalendarOrders),
    [filteredCalendarOrders],
  );

  const dayOrders = calendarByDate.get(selectedDate) ?? [];

  const calendarSuppliers = useMemo(() => {
    const ids = new Set(
      filterDeliveries(state, { ...calendarFilters, supplierId: '', status: 'all' }).map(
        (o) => o.supplierId,
      ),
    );
    return state.suppliers
      .filter((s) => ids.has(s.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [state, calendarFilters]);

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

  const visibleList = useMemo(() => {
    switch (listFilter) {
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
          .filter((o) => deliveryClosedStatuses.includes(o.status))
          .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate));
      case 'upcoming':
      default:
        return tracked;
    }
  }, [listFilter, tracked, state.orders, today]);

  const listGroups = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of visibleList) {
      const list = map.get(order.deliveryDate) ?? [];
      list.push(order);
      map.set(order.deliveryDate, list);
    }
    return Array.from(map.entries());
  }, [visibleList]);

  const inTransit = tracked.filter((o) => o.status === 'shipped');
  const overdueList = tracked.filter(isOverdue);
  const amountToday = tracked
    .filter((o) => o.deliveryDate === today)
    .reduce((sum, o) => sum + orderTotals(o).total, 0);

  const applyCalendarKpi = (kind: 'today' | 'acceptance' | 'overdue') => {
    setView('calendar');
    setSelectedDate(today);
    if (kind === 'today') {
      setCalendarFilters(emptyDeliveryCalendarFilters);
      return;
    }
    if (kind === 'acceptance') {
      setCalendarFilters({ ...emptyDeliveryCalendarFilters, status: 'acceptance' });
      return;
    }
    setCalendarFilters({ ...emptyDeliveryCalendarFilters, status: 'overdue' });
  };

  const handleListKpi = (filter: ListFilter) => {
    setView('list');
    setListFilter(filter);
  };

  return (
    <div className="page pt-5">
      <p className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
        График поставок
      </p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px]">Мои поставки</h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Календарь ожидаемых поставок и трекинг по этапам
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
          onClick={() => (view === 'calendar' ? applyCalendarKpi('today') : handleListKpi('today'))}
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
          onClick={() => {
            if (view === 'calendar') {
              setView('calendar');
              setCalendarFilters({ ...emptyDeliveryCalendarFilters, status: 'in_transit' });
            } else {
              setListFilter('upcoming');
              setView('list');
            }
          }}
        />
        <SummaryTile
          icon={<PackageCheck className="size-4" />}
          label="Ждут приёмки"
          value={withCount(counters.acceptance, 'поставка', 'поставки', 'поставок')}
          hint="проверьте количество и качество"
          tone={counters.acceptance > 0 ? 'warn' : 'neutral'}
          onClick={() =>
            view === 'calendar' ? applyCalendarKpi('acceptance') : handleListKpi('acceptance')
          }
        />
        <SummaryTile
          icon={<AlertTriangle className="size-4" />}
          label="Просрочено"
          value={withCount(overdueList.length, 'заявка', 'заявки', 'заявок')}
          hint={overdueList.length ? 'свяжитесь с поставщиком' : 'срывов нет'}
          tone={overdueList.length ? 'danger' : 'neutral'}
          onClick={() =>
            view === 'calendar' ? applyCalendarKpi('overdue') : handleListKpi('upcoming')
          }
        />
      </div>

      <Tabs
        className="mt-5"
        variant="pills"
        value={view}
        onChange={(id) => setView(id as PageView)}
        items={[
          { id: 'calendar', label: 'Календарь', icon: <CalendarDays className="size-3.5" /> },
          { id: 'list', label: 'Список', icon: <LayoutList className="size-3.5" /> },
        ]}
      />

      {view === 'calendar' ? (
        <div className="mt-4 space-y-4">
          <DeliveryCalendarFilters
            filters={calendarFilters}
            suppliers={calendarSuppliers}
            outlets={state.restaurant.outlets}
            onChange={setCalendarFilters}
          />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="w-full shrink-0 lg:w-[30rem] lg:max-w-[30rem]">
              <DeliveryCalendar
                monthIso={visibleMonth}
                selectedDate={selectedDate}
                ordersByDate={calendarByDate}
                onSelectDate={setSelectedDate}
                onMonthChange={setVisibleMonth}
              />
            </div>
            <div className="min-w-0 flex-1 lg:min-w-[min(100%,24rem)]">
              <DeliveryDayPanel date={selectedDate} orders={dayOrders} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <Tabs
            className="mt-5"
            variant="pills"
            value={listFilter}
            onChange={(next) => setListFilter(next as ListFilter)}
            items={[
              { id: 'upcoming', label: 'Все активные', count: counters.upcoming },
              { id: 'today', label: 'Сегодня', count: counters.today },
              { id: 'week', label: 'Неделя', count: counters.week },
              { id: 'acceptance', label: 'Ждут приёмки', count: counters.acceptance },
              { id: 'closed', label: 'Завершённые', count: counters.closed },
            ]}
          />

          {listGroups.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={<Truck className="size-6" />}
              title="Поставок в этой выборке нет"
              text="Оформите заявку в каталоге — она появится здесь с трекингом по этапам."
              action={<LinkButton to="/catalog">Собрать заявку</LinkButton>}
            />
          ) : (
            <div className="mt-4 space-y-5">
              {listGroups.map(([date, orders]) => (
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
        </>
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
