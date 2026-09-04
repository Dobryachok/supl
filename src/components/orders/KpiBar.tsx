import { AlertTriangle, CalendarDays, ClipboardCheck, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { money, withCount } from '@/lib/format';
import type { OrdersKpi } from '@/store/selectors';

const weekdays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const months = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export function KpiBar({
  kpi,
  active,
  onSelect,
}: {
  kpi: OrdersKpi;
  active?: string;
  onSelect: (key: 'inWork' | 'overdue' | 'today' | 'acts') => void;
}) {
  const now = new Date();
  const dateLabel = `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;

  const tiles = [
    {
      key: 'overdue' as const,
      icon: AlertTriangle,
      label: 'Просрочено',
      value: withCount(kpi.overdueCount, 'заявка', 'заявки', 'заявок'),
      hint: kpi.overdueAmount > 0 ? money(kpi.overdueAmount) : 'всё по графику',
      tone: kpi.overdueCount > 0 ? 'text-danger-300' : 'text-white/50',
    },
    {
      key: 'today' as const,
      icon: CalendarDays,
      label: 'Сегодня',
      value: withCount(kpi.todayCount, 'поставка', 'поставки', 'поставок'),
      hint: dateLabel,
      tone: 'text-success-100',
    },
    {
      key: 'acts' as const,
      icon: ClipboardCheck,
      label: 'Расхождения',
      value: withCount(kpi.actsCount, 'акт', 'акта', 'актов'),
      hint: kpi.actsAmount > 0 ? `на ${money(kpi.actsAmount)}` : 'нет претензий',
      tone: kpi.actsCount > 0 ? 'text-warn-100' : 'text-white/50',
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl bg-ink-800 text-white">
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6">
        <button
          type="button"
          onClick={() => onSelect('inWork')}
          className={cn(
            'flex cursor-pointer flex-col rounded-lg border-l-4 px-4 py-2.5 text-left transition-colors',
            active === 'inWork'
              ? 'border-brand-400 bg-white/10'
              : 'border-danger-500 bg-white/5 hover:bg-white/10',
          )}
        >
          <span className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] text-white/60 uppercase">
            <Wallet className="size-3" />В работе
          </span>
          <span className="mt-1 text-[22px] leading-none font-bold">
            {money(kpi.inWorkAmount)}
          </span>
          <span className="mt-1 text-[11px] text-white/60">
            {withCount(kpi.inWorkCount, 'заявка', 'заявки', 'заявок')}
          </span>
        </button>

        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          {tiles.map((tile) => (
            <button
              key={tile.key}
              type="button"
              onClick={() => onSelect(tile.key)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                active === tile.key ? 'bg-white/10' : 'hover:bg-white/5',
              )}
            >
              <tile.icon className={cn('size-4 shrink-0', tile.tone)} />
              <span className="min-w-0">
                <span className="block text-[10px] tracking-[0.12em] text-white/60 uppercase">
                  {tile.label}
                </span>
                <span className="block text-sm font-semibold">{tile.value}</span>
                <span className="block truncate text-[11px] text-white/50">{tile.hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="hidden shrink-0 text-right text-[11px] tracking-wide text-white/50 uppercase lg:block">
          {dateLabel}
        </div>
      </div>
    </div>
  );
}
