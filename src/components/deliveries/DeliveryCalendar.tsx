import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CircleHelp, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import {
  addMonths,
  buildMonthGrid,
  monthTitle,
  parseYearMonth,
  weekdayLabels,
} from '@/lib/calendar';
import { formatDateRu, isoDate, orderStatusLabels, parseDateRu, startOfToday } from '@/lib/format';
import {
  calendarLegendStatuses,
  orderStatusStyles,
  overdueOrderStyle,
} from '@/lib/orderStatusStyles';
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

type PeriodField = 'from' | 'to';

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
  periodFrom,
  periodTo,
  onPeriodFromChange,
  onPeriodToChange,
  onClearSelection,
}: {
  monthIso: string;
  selectedDate: string | null;
  ordersByDate: Map<string, Order[]>;
  onSelectDate: (iso: string) => void;
  onMonthChange: (monthIso: string) => void;
  periodFrom: string;
  periodTo: string;
  onPeriodFromChange: (value: string) => void;
  onPeriodToChange: (value: string) => void;
  onClearSelection: () => void;
}) {
  const { year, month } = parseYearMonth(monthIso);
  const days = buildMonthGrid(year, month);
  const today = isoDate(startOfToday());

  const [activePeriodField, setActivePeriodField] = useState<PeriodField | null>(null);
  const [fromText, setFromText] = useState(() => (periodFrom ? formatDateRu(periodFrom) : ''));
  const [toText, setToText] = useState(() => (periodTo ? formatDateRu(periodTo) : ''));

  useEffect(() => {
    setFromText(periodFrom ? formatDateRu(periodFrom) : '');
  }, [periodFrom]);

  useEffect(() => {
    setToText(periodTo ? formatDateRu(periodTo) : '');
  }, [periodTo]);

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

  const clearSelection = () => {
    onPeriodFromChange('');
    onPeriodToChange('');
    setFromText('');
    setToText('');
    setActivePeriodField(null);
    onClearSelection();
  };

  const commitPeriodText = (field: PeriodField, text: string) => {
    const parsed = parseDateRu(text);
    if (parsed === null) {
      if (field === 'from') setFromText(periodFrom ? formatDateRu(periodFrom) : '');
      else setToText(periodTo ? formatDateRu(periodTo) : '');
      return;
    }
    if (field === 'from') onPeriodFromChange(parsed);
    else onPeriodToChange(parsed);
  };

  const applyPeriodFromCalendar = (iso: string, field: PeriodField) => {
    if (field === 'from') {
      onPeriodFromChange(iso);
      setFromText(formatDateRu(iso));
      setActivePeriodField('to');
      return;
    }
    onPeriodToChange(iso);
    setToText(formatDateRu(iso));
    setActivePeriodField(null);
  };

  const handleDayClick = (iso: string) => {
    if (activePeriodField) {
      applyPeriodFromCalendar(iso, activePeriodField);
      return;
    }
    onSelectDate(iso);
  };

  const periodInputClass = (field: PeriodField) =>
    cn(
      '!h-9 min-w-0 flex-1 px-2 py-0 text-sm [&_input]:h-full',
      activePeriodField === field && 'border-brand-500 ring-2 ring-brand-200',
    );

  const rangeStart =
    periodFrom && periodTo && periodFrom > periodTo ? periodTo : periodFrom || '';
  const rangeEnd =
    periodFrom && periodTo && periodFrom > periodTo ? periodFrom : periodTo || '';
  const hasPeriodRange = Boolean(rangeStart && rangeEnd);
  const hasPeriodBound = Boolean(rangeStart || rangeEnd);

  return (
    <div className="card p-3 sm:p-4">
      <div className="grid grid-cols-3 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="justify-self-start"
          onClick={prev}
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-center text-[17px] font-bold text-ink-900">{monthTitle(year, month)}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="justify-self-end"
          onClick={next}
          aria-label="Следующий месяц"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="mt-3 flex w-full flex-nowrap items-center gap-2">
        <Input
          type="text"
          inputMode="numeric"
          leading={<span className="text-sm font-medium text-ink-500">С</span>}
          value={fromText}
          placeholder="дд.мм.гггг"
          onChange={(e) => setFromText(e.target.value)}
          onFocus={() => setActivePeriodField('from')}
          onBlur={() => {
            commitPeriodText('from', fromText);
            setActivePeriodField((prev) => (prev === 'from' ? null : prev));
          }}
          className={periodInputClass('from')}
          aria-label="Период с"
        />
        <Input
          type="text"
          inputMode="numeric"
          leading={<span className="text-sm font-medium text-ink-500">По</span>}
          value={toText}
          placeholder="дд.мм.гггг"
          onChange={(e) => setToText(e.target.value)}
          onFocus={() => setActivePeriodField('to')}
          onBlur={() => {
            commitPeriodText('to', toText);
            setActivePeriodField((prev) => (prev === 'to' ? null : prev));
          }}
          className={periodInputClass('to')}
          aria-label="Период по"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="!h-9 shrink-0 px-2.5"
          onClick={goToday}
        >
          Сегодня
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="shrink-0"
          onClick={clearSelection}
          aria-label="Сбросить выбор дня и периода"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-1.5 flex h-4 items-center justify-between gap-3">
        <p
          className={cn(
            'min-w-0 flex-1 truncate text-[11px] leading-4',
            activePeriodField ? 'text-brand-600' : 'text-ink-500',
            !activePeriodField && !hasPeriodBound && 'invisible',
          )}
          aria-hidden={!activePeriodField && !hasPeriodBound}
        >
          {activePeriodField
            ? 'Выберите дату в календаре или введите вручную в формате дд.мм.гггг'
            : hasPeriodRange
              ? `Период: ${formatDateRu(rangeStart)} — ${formatDateRu(rangeEnd)}`
              : rangeStart
                ? `Период с ${formatDateRu(rangeStart)}`
                : `Период по ${formatDateRu(rangeEnd)}`}
        </p>
        {!activePeriodField && (
          <div className="flex shrink-0 items-center gap-1 text-[11px] leading-4 text-ink-500">
            <span>Статусы на календаре</span>
            <div className="group relative">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center text-ink-500 transition-colors hover:text-brand-600"
                aria-label="Показать расшифровку статусов"
              >
                <CircleHelp className="size-3.5" />
              </button>
              <div
                className="pointer-events-none absolute right-0 bottom-full z-20 mb-2 w-56 rounded-lg border border-ink-200 bg-white p-3 opacity-0 shadow-pop transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                role="tooltip"
              >
                <ul className="space-y-1.5">
                {calendarLegendStatuses.map((status) => (
                  <li
                    key={status}
                    className="flex items-center gap-2 text-[11px] text-ink-700"
                  >
                    <span className={cn('size-2 shrink-0 rounded-full', orderStatusStyles[status].dot)} />
                    {orderStatusLabels[status]}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-[11px] text-ink-700">
                  <span className={cn('size-2 shrink-0 rounded-full', overdueOrderStyle.dot)} />
                    Просрочено
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
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
          const isSelected = Boolean(selectedDate && day.iso === selectedDate);
          const inPeriodRange =
            hasPeriodRange && day.iso >= rangeStart && day.iso <= rangeEnd;
          const isPeriodStart = day.iso === rangeStart;
          const isPeriodEnd = day.iso === rangeEnd;
          const isLonelyBound =
            hasPeriodBound && !hasPeriodRange && (isPeriodStart || isPeriodEnd);
          const isPeriodBoundary = isPeriodStart || isPeriodEnd || isLonelyBound;
          const dayNum = Number(day.iso.slice(8, 10));

          let surfaceClass =
            'border-ink-100 bg-white hover:border-brand-200 hover:bg-brand-50/40';
          if (inPeriodRange) {
            surfaceClass = isPeriodBoundary
              ? 'z-[1] border-brand-200 bg-brand-50 ring-1 ring-brand-200/50'
              : 'border-brand-100 bg-brand-50/40 hover:bg-brand-50/60';
          } else if (isLonelyBound) {
            surfaceClass = 'z-[1] border-brand-200 bg-brand-50 ring-1 ring-brand-200/50';
          } else if (isSelected && !activePeriodField && !day.isToday) {
            surfaceClass = 'border-brand-400 bg-brand-50/80 shadow-sm ring-1 ring-brand-300/40';
          } else if (hasOverdue) {
            surfaceClass = 'border-danger-200 bg-danger-50/30';
          }

          return (
            <button
              key={day.iso}
              type="button"
              onMouseDown={(e) => {
                if (activePeriodField) e.preventDefault();
              }}
              onClick={() => handleDayClick(day.iso)}
              aria-label={
                orders.length
                  ? `${dayNum}: ${orders.length} поставок`
                  : `${dayNum}: нет поставок`
              }
              className={cn(
                'relative flex min-h-[4rem] cursor-pointer rounded-md border p-1.5 text-left transition-all sm:min-h-[4.5rem] sm:rounded-lg sm:p-2',
                !day.inMonth && 'opacity-35',
                surfaceClass,
                activePeriodField &&
                  !inPeriodRange &&
                  !isLonelyBound &&
                  'hover:border-brand-400 hover:bg-brand-50/60',
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold sm:text-[13px]',
                    day.isToday && 'bg-brand-600 text-white',
                    !day.isToday && isPeriodBoundary && 'font-semibold text-brand-700',
                    !day.isToday && inPeriodRange && !isPeriodBoundary && 'font-medium text-brand-700',
                    !day.isToday &&
                      !inPeriodRange &&
                      !isLonelyBound &&
                      isSelected &&
                      !activePeriodField &&
                      'text-brand-800',
                    !day.isToday &&
                      !inPeriodRange &&
                      !isLonelyBound &&
                      (!isSelected || activePeriodField) &&
                      'text-ink-800',
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
                              ? overdueOrderStyle.chip
                              : orderStatusStyles[status].chip,
                          )}
                        >
                          <span
                            className={cn(
                              'size-1.5 shrink-0 rounded-full',
                              overdueCount > 0 ? overdueOrderStyle.dot : orderStatusStyles[status].dot,
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
    </div>
  );
}
