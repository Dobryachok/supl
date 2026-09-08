import { Truck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeliveryCard } from '@/components/orders/DeliveryCard';
import {
  dateFull,
  formatDateRu,
  isoDate,
  money,
  relativeDay,
  startOfToday,
  weekday,
  withCount,
} from '@/lib/format';
import { orderTotals } from '@/store/selectors';
import type { Order } from '@/types';

export type DeliveryPanelGroup = { date: string; orders: Order[] };

function normalizeRange(from: string, to: string): [string, string] {
  return from <= to ? [from, to] : [to, from];
}

function periodRangeTitle(from: string, to: string): string {
  const [start, end] = normalizeRange(from, to);
  if (start === end) return `${dateFull(start)}, ${weekday(start)}`;
  return `${formatDateRu(start)} — ${formatDateRu(end)}`;
}

export function DeliveryDayPanel({
  mode,
  selectedDate,
  periodFrom,
  periodTo,
  groups,
}: {
  mode: 'all' | 'day' | 'period';
  selectedDate?: string;
  periodFrom?: string;
  periodTo?: string;
  groups: DeliveryPanelGroup[];
}) {
  const today = isoDate(startOfToday());
  const orders = groups.flatMap((group) => group.orders);
  const total = orders.reduce((sum, o) => sum + orderTotals(o).total, 0);

  const label =
    mode === 'period' ? 'Выбранный период' : mode === 'day' ? 'Выбранный день' : 'Все поставки';
  const title =
    mode === 'period' && periodFrom && periodTo
      ? periodRangeTitle(periodFrom, periodTo)
      : mode === 'day' && selectedDate
        ? `${dateFull(selectedDate)}, ${weekday(selectedDate)}`
        : 'По всем дням';

  const summary =
    orders.length > 0
      ? `${withCount(orders.length, 'поставка', 'поставки', 'поставок')} · ${money(total)}`
      : mode === 'period'
        ? 'Нет поставок в выбранном периоде'
        : mode === 'day'
          ? 'Нет поставок в выбранной выборке'
          : 'Нет поставок по текущим фильтрам';

  return (
    <div
      className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--header-offset,5rem)+1rem)] lg:max-h-[calc(100vh-var(--header-offset,5rem)-2rem)] lg:overflow-y-auto"
    >
      <div className="card shrink-0 p-4">
        <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">{label}</p>
        <h2 className="mt-0.5 text-[17px] font-bold text-ink-900">{title}</h2>
        <p className="mt-1 text-[13px] text-ink-500">{summary}</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<Truck className="size-5" />}
          title={
            mode === 'period'
              ? 'В периоде пусто'
              : mode === 'day'
                ? 'На этот день пусто'
                : 'Поставок нет'
          }
          text={
            mode === 'period'
              ? 'Измените период или фильтры.'
              : mode === 'day'
                ? 'Выберите другой день или измените фильтры.'
                : 'Измените фильтры или оформите заявку в каталоге.'
          }
        />
      ) : mode === 'period' || mode === 'all' ? (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.date}>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-ink-900">
                  {dateFull(group.date)}, {weekday(group.date)}
                </h3>
                <Badge tone={group.date === today ? 'info' : 'neutral'}>
                  {relativeDay(group.date)}
                </Badge>
                <span className="text-[13px] text-ink-500">
                  {withCount(group.orders.length, 'поставка', 'поставки', 'поставок')}
                </span>
              </div>
              <div className="mt-2 space-y-2.5">
                {group.orders.map((order) => (
                  <DeliveryCard key={order.id} order={order} compact />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {groups[0]?.orders.map((order) => (
            <DeliveryCard key={order.id} order={order} compact />
          ))}
        </div>
      )}
    </div>
  );
}
