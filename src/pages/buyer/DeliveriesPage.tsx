import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarDays,
  LayoutList,
  PackageCheck,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { DeliveryCalendar } from '@/components/deliveries/DeliveryCalendar';
import {
  DeliveryCalendarFilters,
} from '@/components/deliveries/DeliveryCalendarFilters';
import { DeliveryDayPanel } from '@/components/deliveries/DeliveryDayPanel';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Field';
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
  emptyDeliveryCalendarFilters,
  filterDeliveries,
  isOverdue,
  orderTotals,
  trackedStatuses,
} from '@/store/selectors';
import type { Order } from '@/types';

type PageView = 'calendar' | 'list';

const closedStatuses: Order['status'][] = ['accepted', 'partially_accepted', 'refused'];

function addDaysToIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

function filterOrdersBySearch(orders: Order[], query: string): Order[] {
  const q = query.trim().toLowerCase();
  if (!q) return orders;
  return orders.filter((order) =>
    `${order.number} ${order.supplierName} ${order.deliveryAddress}`.toLowerCase().includes(q),
  );
}

function applyPeriodFilter(orders: Order[], from: string, to: string): Order[] {
  if (!from && !to) return orders;
  let start = from;
  let end = to;
  if (start && end && start > end) [start, end] = [end, start];
  return orders.filter((order) => {
    if (start && order.deliveryDate < start) return false;
    if (end && order.deliveryDate > end) return false;
    return true;
  });
}

export function DeliveriesPage() {
  const state = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();

  const today = isoDate(startOfToday());
  const view: PageView = searchParams.get('view') === 'list' ? 'list' : 'calendar';
  const selectedDate = searchParams.get('date');

  const [visibleMonth, setVisibleMonth] = useState(
    () => `${(selectedDate ?? today).slice(0, 7)}-01`,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [calendarFilters, setCalendarFilters] = useState<CalendarFilters>(emptyDeliveryCalendarFilters);

  const updateCalendarFilters = (filters: CalendarFilters) => {
    setCalendarFilters(filters);
    setPeriodFrom('');
    setPeriodTo('');
  };

  const setView = (next: PageView) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('view', next);
      return params;
    });
  };

  const setSelectedDate = (iso: string) => {
    setPeriodFrom('');
    setPeriodTo('');
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('date', iso);
      params.set('view', 'calendar');
      return params;
    });
    setVisibleMonth(`${iso.slice(0, 7)}-01`);
  };

  const clearCalendarSelection = () => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete('date');
      params.set('view', 'calendar');
      return params;
    });
    setPeriodFrom('');
    setPeriodTo('');
  };

  const tracked = useMemo(
    () =>
      state.orders
        .filter((o) => trackedStatuses.includes(o.status))
        .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate)),
    [state.orders],
  );

  const filteredOrders = useMemo(() => {
    let orders = filterDeliveries(state, calendarFilters);
    orders = applyPeriodFilter(orders, periodFrom, periodTo);
    return filterOrdersBySearch(orders, searchQuery);
  }, [state, calendarFilters, periodFrom, periodTo, searchQuery]);

  const calendarByDate = useMemo(
    () => deliveriesByDate(filteredOrders),
    [filteredOrders],
  );

  const dayOrders = selectedDate ? (calendarByDate.get(selectedDate) ?? []) : [];

  const hasPeriodRange = Boolean(periodFrom && periodTo);
  const panelMode = hasPeriodRange ? 'period' : selectedDate ? 'day' : 'all';

  const panelGroups = useMemo(() => {
    if (hasPeriodRange) {
      const [start, end] =
        periodFrom! <= periodTo! ? [periodFrom!, periodTo!] : [periodTo!, periodFrom!];
      const groups: { date: string; orders: Order[] }[] = [];
      const cursor = new Date(start);
      const endDate = new Date(end);
      while (cursor <= endDate) {
        const iso = isoDate(cursor);
        const orders = calendarByDate.get(iso) ?? [];
        if (orders.length > 0) groups.push({ date: iso, orders });
        cursor.setDate(cursor.getDate() + 1);
      }
      return groups;
    }
    if (selectedDate) {
      return [{ date: selectedDate, orders: dayOrders }];
    }
    return Array.from(calendarByDate.entries())
      .filter(([, orders]) => orders.length > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, orders]) => ({ date, orders }));
  }, [hasPeriodRange, periodFrom, periodTo, selectedDate, dayOrders, calendarByDate]);

  const calendarSuppliers = useMemo(() => {
    const ids = new Set(
      filterDeliveries(state, { ...calendarFilters, supplierIds: [] }).map(
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

  const listGroups = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of filteredOrders) {
      const list = map.get(order.deliveryDate) ?? [];
      list.push(order);
      map.set(order.deliveryDate, list);
    }
    return Array.from(map.entries());
  }, [filteredOrders]);

  const inTransit = tracked.filter((o) => o.status === 'shipped');
  const overdueList = tracked.filter(isOverdue);
  const amountToday = tracked
    .filter((o) => o.deliveryDate === today)
    .reduce((sum, o) => sum + orderTotals(o).total, 0);

  const applyCalendarKpi = (kind: 'today' | 'acceptance' | 'overdue') => {
    setView('calendar');
    setSelectedDate(today);
    setPeriodFrom('');
    setPeriodTo('');
    if (kind === 'today') {
      setCalendarFilters(emptyDeliveryCalendarFilters);
      return;
    }
    if (kind === 'acceptance') {
      setCalendarFilters({ ...emptyDeliveryCalendarFilters, statuses: ['acceptance'] });
      return;
    }
    setCalendarFilters({ ...emptyDeliveryCalendarFilters, statuses: ['overdue'] });
  };

  const handleListKpi = (kind: 'today' | 'week' | 'acceptance' | 'closed' | 'overdue' | 'in_transit') => {
    setView('list');
    if (kind === 'today') {
      setPeriodFrom(today);
      setPeriodTo(today);
    } else if (kind === 'week') {
      setPeriodFrom(today);
      setPeriodTo(addDaysToIso(today, 7));
    } else {
      setPeriodFrom('');
      setPeriodTo('');
    }
    if (kind === 'acceptance') {
      setCalendarFilters({ ...emptyDeliveryCalendarFilters, statuses: ['acceptance'] });
      return;
    }
    if (kind === 'closed') {
      setCalendarFilters({ ...emptyDeliveryCalendarFilters, statuses: ['closed'] });
      return;
    }
    if (kind === 'overdue') {
      setCalendarFilters({ ...emptyDeliveryCalendarFilters, statuses: ['overdue'] });
      return;
    }
    if (kind === 'in_transit') {
      setCalendarFilters({ ...emptyDeliveryCalendarFilters, statuses: ['in_transit'] });
      return;
    }
    setCalendarFilters(emptyDeliveryCalendarFilters);
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
              setPeriodFrom('');
              setPeriodTo('');
              setCalendarFilters({ ...emptyDeliveryCalendarFilters, statuses: ['in_transit'] });
            } else {
              handleListKpi('in_transit');
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
            view === 'calendar' ? applyCalendarKpi('overdue') : handleListKpi('overdue')
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

      <div className="mt-4 space-y-4">
        <DeliveryCalendarFilters
          filters={calendarFilters}
          suppliers={calendarSuppliers}
          outlets={state.restaurant.outlets}
          onChange={updateCalendarFilters}
        />

        {view === 'calendar' ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <div className="w-full shrink-0 lg:w-[30rem] lg:max-w-[30rem]">
              <DeliveryCalendar
                monthIso={visibleMonth}
                selectedDate={selectedDate}
                ordersByDate={calendarByDate}
                onSelectDate={setSelectedDate}
                onMonthChange={setVisibleMonth}
                periodFrom={periodFrom}
                periodTo={periodTo}
                onPeriodFromChange={setPeriodFrom}
                onPeriodToChange={setPeriodTo}
                onClearSelection={clearCalendarSelection}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-3 lg:min-w-[min(100%,24rem)]">
              <DeliveriesSearchInput value={searchQuery} onChange={setSearchQuery} />
              <DeliveryDayPanel
                mode={panelMode}
                selectedDate={selectedDate ?? undefined}
                periodFrom={periodFrom}
                periodTo={periodTo}
                groups={panelGroups}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="date"
                leading={<span className="text-sm font-medium text-ink-500">С</span>}
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className={cn(dateControlClass, 'min-w-[9.5rem] flex-1 px-2.5 sm:max-w-[11rem]')}
                aria-label="Дата с"
              />
              <Input
                type="date"
                leading={<span className="text-sm font-medium text-ink-500">По</span>}
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className={cn(dateControlClass, 'min-w-[9.5rem] flex-1 px-2.5 sm:max-w-[11rem]')}
                aria-label="Дата по"
              />
              <DeliveriesSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                className="min-w-[12rem] flex-[2]"
              />
            </div>

            {listGroups.length === 0 ? (
              <EmptyState
                icon={<Truck className="size-6" />}
                title="Поставок в этой выборке нет"
                text="Оформите заявку в каталоге — она появится здесь с трекингом по этапам."
                action={<LinkButton to="/catalog">Собрать заявку</LinkButton>}
              />
            ) : (
              <div className="space-y-5">
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
    </div>
  );
}

const dateControlClass = '!h-10 py-0 text-sm [&_input]:h-full';

function DeliveriesSearchInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex h-10 min-w-0 items-center gap-2 rounded-lg border border-ink-300 bg-white px-3 transition-colors',
        'focus-within:border-brand-500 focus-within:outline-2 focus-within:outline-brand-200',
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-ink-400" />
      <input
        type="search"
        placeholder="Поиск по заявке, поставщику, адресу"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400"
        aria-label="Поиск поставок"
      />
      {value && (
        <button
          type="button"
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
          aria-label="Очистить поиск"
          onClick={() => onChange('')}
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
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
