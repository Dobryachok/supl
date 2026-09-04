import { cn } from '@/lib/cn';
import { dateTime, orderStatusLabels } from '@/lib/format';
import type { Order, OrderStatus } from '@/types';
import { statusIcons } from './StatusBadge';

const plannedFlow: OrderStatus[] = [
  'sent',
  'confirmed',
  'shipped',
  'delivered',
  'accepted',
];

const actorLabels: Record<'buyer' | 'seller' | 'system', string> = {
  buyer: 'Ресторан',
  seller: 'Поставщик',
  system: 'Система',
};

export function OrderTimeline({ order }: { order: Order }) {
  const passed = new Map(order.timeline.map((event) => [event.status, event]));
  const terminal: OrderStatus[] = ['rejected', 'cancelled', 'refused', 'partially_accepted'];
  const finished = order.timeline.filter((e) => terminal.includes(e.status));

  const steps: { status: OrderStatus; at?: string; actor?: string; comment?: string }[] =
    plannedFlow.map((status) => {
      const event = passed.get(status);
      return {
        status,
        at: event?.at,
        actor: event ? actorLabels[event.actor] : undefined,
        comment: event?.comment,
      };
    });

  for (const event of finished) {
    steps.push({
      status: event.status,
      at: event.at,
      actor: actorLabels[event.actor],
      comment: event.comment,
    });
  }

  const currentIndex = steps.reduce((last, step, i) => (step.at ? i : last), -1);

  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const done = Boolean(step.at);
        const isCurrent = index === currentIndex;
        return (
          <li key={`${step.status}-${index}`} className="flex gap-3 pb-4 last:pb-0">
            <div className="relative flex flex-col items-center">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2',
                  done
                    ? isCurrent
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-success-500 bg-success-50 text-success-600'
                    : 'border-ink-200 bg-white text-ink-300',
                )}
              >
                {statusIcons[step.status]}
              </span>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'w-0.5 flex-1',
                    done && steps[index + 1]?.at ? 'bg-success-500' : 'bg-ink-200',
                  )}
                />
              )}
            </div>
            <div className="pb-1">
              <p
                className={cn(
                  'text-[13px] font-semibold',
                  done ? 'text-ink-900' : 'text-ink-400',
                )}
              >
                {orderStatusLabels[step.status]}
                {isCurrent && (
                  <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-brand-700 uppercase">
                    текущий
                  </span>
                )}
              </p>
              {step.at ? (
                <p className="text-xs text-ink-500">
                  {dateTime(step.at)} · {step.actor}
                </p>
              ) : (
                <p className="text-xs text-ink-400">ожидается</p>
              )}
              {step.comment && <p className="mt-1 text-[13px] text-ink-600">{step.comment}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderProgress({ order }: { order: Order }) {
  const flow: OrderStatus[] = ['sent', 'confirmed', 'shipped', 'delivered'];
  const reached = flow.filter((status) => order.timeline.some((e) => e.status === status)).length;
  const failed = ['rejected', 'cancelled', 'refused'].includes(order.status);
  const percent = failed ? 100 : Math.round((reached / flow.length) * 100);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          failed
            ? 'bg-danger-500'
            : order.status === 'partially_accepted'
              ? 'bg-warn-500'
              : order.status === 'accepted'
                ? 'bg-success-500'
                : 'bg-brand-500',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
