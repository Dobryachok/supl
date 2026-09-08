import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  MapPin,
  MessageSquare,
  PackageCheck,
  Phone,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { DeliveryTrackerMini } from '@/components/orders/DeliveryTracker';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useChatActions } from '@/hooks/useChatActions';
import { cn } from '@/lib/cn';
import { money, withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { isOverdue, orderTotals } from '@/store/selectors';
import type { Order, OrderLine } from '@/types';

function compactLinesSummary(lines: OrderLine[]): string {
  const prefix = withCount(lines.length, 'позиция', 'позиции', 'позиций');
  if (lines.length === 0) return prefix;
  if (lines.length === 1) return `${prefix} · ${lines[0].name}`;
  return `${prefix} · ${lines[0].name} и ещё ${lines.length - 1}`;
}

export function DeliveryCard({ order, compact = false }: { order: Order; compact?: boolean }) {
  const state = useAppState();
  const chat = useChatActions();
  const navigate = useNavigate();
  const supplier = state.suppliers.find((s) => s.id === order.supplierId);
  const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId);
  const totals = orderTotals(order);
  const overdue = isOverdue(order);

  return (
    <article
      className={cn(
        'card transition-shadow hover:shadow-hover',
        compact ? 'p-5' : 'p-4',
        overdue && 'border-danger-100',
        order.status === 'delivered' && 'border-warn-100',
      )}
    >
      {compact ? (
        <div>
          <div className="space-y-4">
            <div className="flex gap-3">
            <div className="flex min-w-0 flex-1 items-end gap-3">
              {supplier && (
                <SupplierLogo
                  name={supplier.name}
                  hue={supplier.hue}
                  className="size-14 shrink-0 rounded-lg aspect-square text-base"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    to={`/orders/${order.id}`}
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
                <Link
                  to={`/suppliers/${order.supplierId}`}
                  className="mt-0.5 block truncate text-[13px] text-ink-600 hover:text-brand-600"
                >
                  {order.supplierName}
                </Link>
                <p className="mt-1 truncate text-xs text-ink-500" title={compactLinesSummary(order.lines)}>
                  {compactLinesSummary(order.lines)}
                </p>
              </div>
            </div>
            <div className="shrink-0 self-start text-right">
              <p className="text-[15px] font-bold text-ink-900">{money(totals.factTotal)}</p>
              <p className="text-[11px] text-ink-500">{order.deliveryWindow}</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <dl className="min-w-0 space-y-1 text-[12px] text-ink-600">
              <div className="flex min-w-0 items-center gap-1">
                <MapPin className="size-3 shrink-0 text-ink-400" />
                <p className="min-w-0 truncate">
                  <span>{outlet?.name}</span>
                  <span className="text-[11px] text-ink-500"> · {order.deliveryAddress}</span>
                </p>
              </div>
              {supplier && (
                <div className="flex min-w-0 items-center gap-1">
                  <Phone className="size-3 shrink-0 text-ink-400" />
                  <p className="min-w-0 truncate">
                    <a
                      href={`tel:${supplier.contacts.phone.replace(/\s|\(|\)|-/g, '')}`}
                      className="hover:text-brand-600"
                    >
                      {supplier.contacts.phone}
                    </a>
                    {supplier.contacts.manager && (
                      <span className="text-[11px] text-ink-500"> · {supplier.contacts.manager}</span>
                    )}
                  </p>
                </div>
              )}
            </dl>

            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              {order.status === 'delivered' ? (
                <LinkButton
                  to={`/orders/${order.id}/acceptance`}
                  size="sm"
                  icon={<PackageCheck className="size-3.5" />}
                >
                  Принять
                </LinkButton>
              ) : (
                <LinkButton to={`/orders/${order.id}`} size="sm" variant="secondary">
                  Открыть
                </LinkButton>
              )}
              <Button
                size="sm"
                variant="secondary"
                icon={<MessageSquare className="size-3.5" />}
                onClick={() => {
                  const threadId = chat.ensureThread({
                    supplierId: order.supplierId,
                    orderId: order.id,
                    subject: `Заявка ${order.number}`,
                  });
                  navigate(`/chats?thread=${threadId}`);
                }}
              >
                Чат
              </Button>
            </div>
          </div>
          </div>

          <DeliveryTrackerMini order={order} className="mt-5" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[2.75rem_minmax(0,1fr)_13.75rem_9.375rem] lg:items-start lg:gap-4">
        {supplier && (
          <SupplierLogo
            name={supplier.name}
            hue={supplier.hue}
            className="size-11 sm:col-start-1 sm:row-start-1 lg:col-start-1 lg:row-start-1"
          />
        )}
        <div className="min-w-0 sm:col-start-2 sm:row-start-1 lg:col-start-2 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/orders/${order.id}`}
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
          <Link
            to={`/suppliers/${order.supplierId}`}
            className="mt-0.5 block text-[13px] text-ink-600 hover:text-brand-600"
          >
            {order.supplierName}
          </Link>
          <p className="mt-1 text-xs text-ink-500">
            {withCount(order.lines.length, 'позиция', 'позиции', 'позиций')} ·{' '}
            {order.lines
              .slice(0, 2)
              .map((l) => l.name)
              .join(', ')}
            {order.lines.length > 2 ? ` и ещё ${order.lines.length - 2}` : ''}
          </p>
        </div>

        <dl className="space-y-1 text-[13px] sm:col-span-2 sm:row-start-2 lg:col-span-1 lg:col-start-3 lg:row-start-1">
          <div className="grid grid-cols-[0.875rem_minmax(0,1fr)] items-center gap-x-1.5 text-ink-700">
            <Clock className="size-3.5 text-ink-400" />
            <span>{order.deliveryWindow}</span>
          </div>
          <div className="grid grid-cols-[0.875rem_minmax(0,1fr)] items-start gap-x-1.5 text-ink-600">
            <MapPin className="mt-0.5 size-3.5 text-ink-400" />
            <span>
              {outlet?.name}
              <span className="block text-xs text-ink-500">{order.deliveryAddress}</span>
            </span>
          </div>
          {supplier && (
            <div className="grid grid-cols-[0.875rem_minmax(0,1fr)] items-center gap-x-1.5 text-ink-600">
              <Phone className="size-3.5 text-ink-400" />
              <span>{supplier.contacts.phone}</span>
            </div>
          )}
        </dl>

        <div className="sm:col-span-2 sm:row-start-3 sm:text-left lg:col-start-4 lg:row-start-1 lg:text-right">
          <p className="text-[17px] font-bold text-ink-900">{money(totals.factTotal)}</p>
          <p className="text-xs text-ink-500">
            {order.deliveryFee === 0 ? 'доставка бесплатно' : `доставка ${money(order.deliveryFee)}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:justify-start lg:justify-end">
            {order.status === 'delivered' ? (
              <LinkButton
                to={`/orders/${order.id}/acceptance`}
                size="sm"
                icon={<PackageCheck className="size-3.5" />}
              >
                Принять
              </LinkButton>
            ) : (
              <LinkButton to={`/orders/${order.id}`} size="sm" variant="secondary">
                Открыть
              </LinkButton>
            )}
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
                navigate(`/chats?thread=${threadId}`);
              }}
            >
              Чат
            </Button>
          </div>
        </div>
          </div>

          <DeliveryTrackerMini order={order} className="mt-3" />
        </>
      )}
    </article>
  );
}
