import { CheckCircle2, FileEdit, PackageCheck, Send, Truck, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { orderStatusStyles } from '@/lib/orderStatusStyles';
import type { OrderStatus } from '@/types';

const stages: { status: OrderStatus; label: string; icon: typeof Send }[] = [
  { status: 'draft', label: 'Черновики', icon: FileEdit },
  { status: 'sent', label: 'Отправлены', icon: Send },
  { status: 'confirmed', label: 'Подтверждены', icon: CheckCircle2 },
  { status: 'shipped', label: 'В пути', icon: Truck },
  { status: 'delivered', label: 'Доставлены', icon: PackageCheck },
];

export function StatusFunnel({
  counts,
  total,
  value,
  onChange,
}: {
  counts: Record<OrderStatus, number>;
  total: number;
  value: OrderStatus | 'all';
  onChange: (status: OrderStatus | 'all') => void;
}) {
  const closed = counts.accepted + counts.partially_accepted + counts.refused;
  const cancelled = counts.cancelled + counts.rejected;

  return (
    <div className="card flex flex-wrap items-stretch divide-ink-100 overflow-hidden sm:divide-x">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'flex min-w-[120px] cursor-pointer flex-col justify-center px-4 py-3 text-left transition-colors',
          value === 'all' ? 'bg-brand-50' : 'hover:bg-ink-50',
        )}
      >
        <span className={cn('text-[13px] font-semibold', value === 'all' ? 'text-brand-700' : 'text-ink-700')}>
          Весь поток
        </span>
        <span className="text-[22px] leading-tight font-bold text-ink-900">{total}</span>
      </button>

      <div className="flex flex-1 flex-wrap items-center">
        {stages.map((stage, index) => (
          <div key={stage.status} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => onChange(stage.status)}
              className={cn(
                'flex min-w-[130px] flex-1 cursor-pointer items-center gap-2.5 px-3 py-3 text-left transition-colors',
                value === stage.status ? 'bg-brand-50' : 'hover:bg-ink-50',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full',
                  counts[stage.status] > 0
                    ? orderStatusStyles[stage.status].iconDone
                    : 'bg-ink-100 text-ink-400',
                )}
              >
                <stage.icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] tracking-wide text-ink-500 uppercase">
                  {stage.label}
                </span>
                <span className="block text-lg leading-tight font-bold text-ink-900">
                  {counts[stage.status]}
                </span>
              </span>
            </button>
            {index < stages.length - 1 && (
              <span className="hidden h-px w-4 bg-ink-200 lg:block" aria-hidden />
            )}
          </div>
        ))}
      </div>

      <div className="flex">
        <button
          type="button"
          onClick={() => onChange('accepted')}
          className={cn(
            'flex min-w-[120px] cursor-pointer items-center gap-2.5 border-l border-ink-100 px-3 py-3 text-left transition-colors',
            value === 'accepted' ? 'bg-success-50' : 'hover:bg-ink-50',
          )}
        >
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              orderStatusStyles.accepted.iconDone,
            )}
          >
            <PackageCheck className="size-4" />
          </span>
          <span>
            <span className="block text-[11px] tracking-wide text-ink-500 uppercase">Закрыты</span>
            <span className="block text-lg leading-tight font-bold text-ink-900">{closed}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange('cancelled')}
          className={cn(
            'flex min-w-[110px] cursor-pointer items-center gap-2.5 border-l border-ink-100 px-3 py-3 text-left transition-colors',
            value === 'cancelled' ? 'bg-ink-100' : 'hover:bg-ink-50',
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
            <XCircle className="size-4" />
          </span>
          <span>
            <span className="block text-[11px] tracking-wide text-ink-500 uppercase">Отменены</span>
            <span className="block text-lg leading-tight font-bold text-ink-900">{cancelled}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
