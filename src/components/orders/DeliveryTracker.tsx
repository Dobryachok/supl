import { AlertTriangle, Ban, CheckCircle2, ClipboardCheck, PackageCheck, Send, ThumbsDown, Truck, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { dateTime, orderStatusLabels, relativeDay } from '@/lib/format';
import { orderStatusStyles, overdueOrderStyle } from '@/lib/orderStatusStyles';
import { isOverdue } from '@/store/selectors';
import type { Order, OrderStatus } from '@/types';

interface Stage {
  status: OrderStatus;
  label: string;
  caption: string;
  hint: string;
  icon: LucideIcon;
}

const stages: Stage[] = [
  { status: 'sent', label: 'Заявка', caption: 'Заявка отправлена', hint: 'отправлена поставщику', icon: Send },
  { status: 'confirmed', label: 'Подтверждена', caption: 'Подтверждена', hint: 'поставщик собирает заказ', icon: CheckCircle2 },
  { status: 'shipped', label: 'В пути', caption: 'В пути', hint: 'машина вышла в рейс', icon: Truck },
  { status: 'delivered', label: 'Доставлена', caption: 'Доставлена', hint: 'привезли на склад', icon: PackageCheck },
  { status: 'accepted', label: 'Приёмка', caption: 'Приёмка', hint: 'проверена на складе', icon: ClipboardCheck },
];

const breakStatuses: Partial<Record<OrderStatus, { label: string; icon: LucideIcon; text: string }>> = {
  rejected: { label: 'Заявка отклонена', icon: XCircle, text: 'Поставщик не смог выполнить заявку' },
  cancelled: { label: 'Заявка отменена', icon: Ban, text: 'Заявка отменена рестораном' },
  refused: { label: 'Отказ от поставки', icon: ThumbsDown, text: 'Склад не принял поставку' },
};

/** Номер этапа, на котором находится заявка: 0 — ещё черновик, 5 — приёмка завершена. */
function reachedIndex(order: Order): number {
  if (order.status === 'partially_accepted' || order.status === 'accepted') return stages.length;
  let reached = 0;
  stages.forEach((stage, index) => {
    if (order.timeline.some((event) => event.status === stage.status)) reached = index + 1;
  });
  return reached;
}

function stageTime(order: Order, status: OrderStatus): string | undefined {
  if (status === 'accepted') {
    return order.timeline.find((e) => e.status === 'accepted' || e.status === 'partially_accepted')
      ?.at;
  }
  return order.timeline.find((e) => e.status === status)?.at;
}

/**
 * Горизонтальный трекер этапов поставки — одинаковый для ресторана и поставщика,
 * чтобы обе стороны видели одну и ту же картину по заявке.
 */
export function DeliveryTracker({ order, className }: { order: Order; className?: string }) {
  const broken = breakStatuses[order.status];
  const reached = reachedIndex(order);
  const overdue = isOverdue(order);

  if (broken) {
    const passed = stages.slice(0, reached);
    return (
      <div className={cn('rounded-xl border border-danger-100 bg-danger-50 p-4', className)}>
        <p className="flex items-center gap-2 text-sm font-bold text-danger-600">
          <broken.icon className="size-4" />
          {broken.label}
        </p>
        <p className="mt-1 text-[13px] text-danger-600">
          {order.rejectReason || broken.text}
        </p>
        {passed.length > 0 && (
          <p className="mt-2 text-xs text-ink-500">
            Пройденные этапы: {passed.map((s) => s.label.toLowerCase()).join(' → ')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('card p-4', className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px]">Этапы поставки</h2>
        <p
          className={cn(
            'text-[13px]',
            overdue ? 'font-semibold text-danger-600' : 'text-ink-500',
          )}
        >
          {overdue ? (
            <span className="flex items-center gap-1">
              <AlertTriangle className="size-3.5" />
              Срок доставки прошёл — {relativeDay(order.deliveryDate)}
            </span>
          ) : (
            <>
              {order.status === 'accepted' || order.status === 'partially_accepted'
                ? 'Поставка закрыта'
                : `Доставка ${relativeDay(order.deliveryDate)}, ${order.deliveryWindow}`}
            </>
          )}
        </p>
      </div>

      <ol className="flex flex-col gap-3 sm:flex-row">
        {stages.map((stage, index) => {
          const done = index < reached;
          const current = index === reached - 1;
          const at = stageTime(order, stage.status);
          const partial = stage.status === 'accepted' && order.status === 'partially_accepted';
          const visual =
            partial ? orderStatusStyles.partially_accepted : orderStatusStyles[stage.status];
          return (
            <li key={stage.status} className="flex flex-1 gap-3 sm:block">
              <div className="flex flex-col items-center sm:flex-row">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    partial || current
                      ? visual.iconActive
                      : done
                        ? visual.iconDone
                        : 'border-ink-200 bg-white text-ink-300',
                  )}
                >
                  <stage.icon className="size-4" />
                </span>
                <span
                  className={cn(
                    'w-0.5 flex-1 sm:h-0.5 sm:w-full',
                    index === stages.length - 1 && 'hidden',
                    index < reached - 1 ? visual.dot : 'bg-ink-200',
                  )}
                />
              </div>
              <div className="pb-2 sm:pt-2 sm:pb-0">
                <p
                  className={cn(
                    'text-[13px] font-semibold',
                    done ? 'text-ink-900' : 'text-ink-400',
                  )}
                >
                  {partial ? orderStatusLabels.partially_accepted : stage.label}
                </p>
                <p className="text-xs text-ink-500">
                  {at ? dateTime(at) : current ? 'в работе' : stage.hint}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Компактная полоса этапов для списков и карточек поставок. */
export function DeliveryTrackerMini({ order, className }: { order: Order; className?: string }) {
  const broken = breakStatuses[order.status];
  const reached = reachedIndex(order);
  const partial = order.status === 'partially_accepted';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex gap-1">
        {stages.map((stage, index) => {
          const done = index < reached;
          const current = index === reached - 1 && !broken;
          const isPartialStage = stage.status === 'accepted' && partial;
          const visual = isPartialStage
            ? orderStatusStyles.partially_accepted
            : orderStatusStyles[stage.status];
          const caption =
            stage.status === 'accepted' && partial
              ? 'Расхождения'
              : stage.caption;

          return (
            <div key={stage.status} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
              <span
                title={`${stage.label} — ${stage.hint}`}
                className={cn(
                  'w-full truncate text-center text-[9px] leading-tight sm:text-[10px]',
                  done
                    ? broken
                      ? cn('font-medium', overdueOrderStyle.label)
                      : cn('font-medium', visual.label)
                    : current
                      ? cn('font-medium', visual.label)
                      : 'text-ink-300',
                )}
              >
                {caption}
              </span>
              <span
                className={cn(
                  'h-1.5 w-full rounded-full',
                  broken
                    ? done
                      ? overdueOrderStyle.dot
                      : 'bg-ink-100'
                    : done || current
                      ? visual.dot
                      : 'bg-ink-100',
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
