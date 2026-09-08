import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  addMonths,
  buildMonthGrid,
  monthTitle,
  parseYearMonth,
  weekdayLabels,
} from '@/lib/calendar';
import { isoDate, orderStatusLabels, startOfToday } from '@/lib/format';
import { isOverdue } from '@/store/selectors';
import type { Order, OrderStatus } from '@/types';

/** Порядок отображения статусов в ячейке дня. */
const statusOrder: OrderStatus[] = [
  'delivered',
  'shipped',
  'confirmed',
  'sent',
  'partially_accepted',
  'accepted',
  'refused',
  'rejected',
  'cancelled',
];

const statusStyles: Record<
  OrderStatus,
  { chip: string; dot: string; short: string }
> = {
  draft: { chip: 'bg-ink-100 text-ink-600', dot: 'bg-ink-400', short: 'Черн.' },
  sent: { chip: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500', short: 'Отпр.' },
  confirmed: { chip: 'bg-brand-100 text-brand-800', dot: 'bg-brand-600', short: 'Подтв.' },
  rejected: { chip: 'bg-danger-100 text-danger-700', dot: 'bg-danger-500', short: 'Откл.' },
  shipped: { chip: 'bg-frost-50 text-frost-600', dot: 'bg-frost-500', short: 'В пути' },
  delivered: { chip: 'bg-warn-100 text-warn-800', dot: 'bg-warn-500', short: 'Приёмка' },
  accepted: { chip: 'bg-success-50 text-success-700', dot: 'bg-success-500', short: 'Принята' },
  partially_accepted: {
    chip: 'bg-warn-50 text-warn-700',
    dot: 'bg-warn-600',
    short: 'Расх.',
  },
  refused: { chip: 'bg-danger-50 text-danger-600', dot: 'bg-danger-400', short: 'Отказ' },
  cancelled: { chip: 'bg-ink-100 text-ink-500', dot: 'bg-ink-300', short: 'Отмена' },
};

const legendStatuses: OrderStatus[] = [
  'sent',
  'confirmed',
  'shipped',
  'delivered',
  'accepted',
  'partially_accepted',
];

function countByStatus(orders: Order[]): { status: OrderStatus; count: number }[] {
  const map = new Map<OrderStatus, number>();
  for (const order of orders) {
    map.set(order.status, (map.get(order.status) ?? 0) + 1);
  }
  return statusOrder
    .filter((status) => map.has(status))
    .map((status) => ({ status, count: map.get(status)! }));
}

export function DeliveryCalendar({
  monthIso,
  selectedDate,
  ordersByDate,
  onSelectDate,
  onMonthChange,
}: {
  monthIso: string;
  selectedDate: string;
  ordersByDate: Map<string, Order[]>;
  onSelectDate: (iso: string) => void;
  onMonthChange: (monthIso: string) => void;
}) {
  const { year, month } = parseYearMonth(monthIso);
  const days = buildMonthGrid(year, month);
  const today = isoDate(startOfToday());

  const prev = () => {
    const next = addMonths(year, month, -1);
    onMonthChange(`${next.year}-${String(next.month + 1).padStart(2, '0')}-01`);
  };

  const next = () => {
    const nextMonth = addMonths(year, month, 1);
    onMonthChange(`${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, '0')}-01`);
  };

  const goToday = () => {
    onMonthChange(`${today.slice(0, 7)}-01`);
    onSelectDate(today);
  };

  return (
    <div className="card p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px] font-bold text-ink-900">{monthTitle(year, month)}</h2>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={prev}
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={goToday}>
            Сегодня
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={next}
            aria-label="Следующий месяц"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-0.5 sm:gap-1">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[11px] font-semibold tracking-wide text-ink-400 uppercase"
          >
            {label}
          </div>
        ))}

        {days.map((day) => {
          const orders = ordersByDate.get(day.iso) ?? [];
          const statusCounts = countByStatus(orders);
          const hasOverdue = orders.some(isOverdue);
          const isSelected = day.iso === selectedDate;
          const dayNum = Number(day.iso.slice(8, 10));

          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => onSelectDate(day.iso)}
              aria-label={
                orders.length
                  ? `${dayNum}: ${orders.length} поставок`
                  : `${dayNum}: нет поставок`
              }
              className={cn(
                'relative flex min-h-[4rem] cursor-pointer rounded-md border p-1.5 text-left transition-all sm:min-h-[4.5rem] sm:rounded-lg sm:p-2',
                !day.inMonth && 'opacity-35',
                isSelected
                  ? 'border-brand-600 bg-brand-50 shadow-sm ring-2 ring-brand-500/30'
                  : 'border-ink-100 bg-white hover:border-brand-200 hover:bg-brand-50/40',
                day.isToday && !isSelected && 'ring-2 ring-brand-400/50',
                hasOverdue && !isSelected && 'border-danger-300 bg-danger-50/40',
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold sm:text-[13px]',
                    day.isToday && 'bg-brand-600 text-white',
                    !day.isToday && isSelected && 'text-brand-800',
                    !day.isToday && !isSelected && 'text-ink-800',
                  )}
                >
                  {dayNum}
                </span>

                {statusCounts.length > 0 && (
                  <div className="flex min-w-0 flex-col items-end gap-0.5">
                    {statusCounts.map(({ status, count }) => {
                      const overdueCount = orders.filter(
                        (o) => o.status === status && isOverdue(o),
                      ).length;
                      return (
                        <span
                          key={status}
                          title={`${orderStatusLabels[status]}: ${count}`}
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded px-1 py-px text-[9px] font-semibold leading-tight sm:text-[10px]',
                            overdueCount > 0
                              ? 'bg-danger-100 text-danger-800'
                              : statusStyles[status].chip,
                          )}
                        >
                          <span
                            className={cn(
                              'size-1.5 shrink-0 rounded-full',
                              overdueCount > 0 ? 'bg-danger-500' : statusStyles[status].dot,
                            )}
                          />
                          {count}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-ink-100 pt-3">
        <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
          Статусы на календаре
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
          {legendStatuses.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1.5 text-[11px] text-ink-600"
            >
              <span className={cn('size-2 rounded-full', statusStyles[status].dot)} />
              {orderStatusLabels[status]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-600">
            <span className="size-2 rounded-full bg-danger-500" />
            Просрочено
          </span>
        </div>
      </div>
    </div>
  );
}
