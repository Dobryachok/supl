import { Link, useNavigate } from 'react-router-dom';
import type { MouseEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  PackageCheck,
  Phone,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { DeliveryTrackerMini } from '@/components/orders/DeliveryTracker';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { useChatActions } from '@/hooks/useChatActions';
import { MarkDeliveredButton } from '@/components/orders/MarkDeliveredButton';
import { useOrderFlow } from '@/hooks/useOrderFlow';
import { cn } from '@/lib/cn';
import { money, withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { isOverdue, orderTotals } from '@/store/selectors';
import type { Order, OrderLine, Role } from '@/types';

function compactLinesSummary(lines: OrderLine[]): string {
  const prefix = withCount(lines.length, 'позиция', 'позиции', 'позиций');
  if (lines.length === 0) return prefix;
  if (lines.length === 1) return `${prefix} · ${lines[0].name}`;
  return `${prefix} · ${lines[0].name} и ещё ${lines.length - 1}`;
}

function stopCardClick(event: MouseEvent) {
  event.stopPropagation();
}

export function DeliveryCard({
  order,
  compact = false,
  role = 'buyer',
}: {
  order: Order;
  compact?: boolean;
  role?: Role;
}) {
  const state = useAppState();
  const chat = useChatActions();
  const flow = useOrderFlow();
  const navigate = useNavigate();
  const isSeller = role === 'seller';
  const supplier = state.suppliers.find((s) => s.id === order.supplierId);
  const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId);
  const totals = orderTotals(order);
  const overdue = isOverdue(order);
  const orderUrl = isSeller ? `/seller/orders/${order.id}` : `/orders/${order.id}`;
  const counterpartyName = isSeller ? state.restaurant.name : order.supplierName;
  const logoName = isSeller ? state.restaurant.name : supplier?.name ?? '';
  const logoHue = isSeller ? 32 : supplier?.hue ?? 210;

  const openOrder = () => navigate(orderUrl);

  const openChat = () => {
    const threadId = chat.ensureThread({
      supplierId: order.supplierId,
      orderId: order.id,
      subject: `Заявка ${order.number}`,
    });
    navigate(isSeller ? `/seller/chats?thread=${threadId}` : `/chats?thread=${threadId}`);
  };

  const renderActions = (alignEnd = false) => (
    <div
      className={cn(
        'flex flex-wrap gap-1.5',
        alignEnd ? 'mt-auto pt-7 sm:justify-start lg:justify-end' : 'shrink-0 justify-end',
      )}
    >
      {isSeller ? (
        <>
          {order.status === 'sent' && (
            <Button
              size="sm"
              icon={<CheckCircle2 className="size-3.5" />}
              onClick={(event) => {
                stopCardClick(event);
                flow.confirm(order);
              }}
            >
              Подтвердить
            </Button>
          )}
          {order.status === 'confirmed' && (
            <Button
              size="sm"
              icon={<Truck className="size-3.5" />}
              onClick={(event) => {
                stopCardClick(event);
                flow.ship(order);
              }}
            >
              Отправить
            </Button>
          )}
          {order.status === 'shipped' && (
            <Button
              size="sm"
              variant="success"
              icon={<PackageCheck className="size-3.5" />}
              onClick={(event) => {
                stopCardClick(event);
                flow.deliver(order);
              }}
            >
              Доставлено
            </Button>
          )}
          {order.status === 'delivered' && (
            <Badge tone="progress" size="sm">Ждём приёмку</Badge>
          )}
        </>
      ) : (
        <>
          {order.status === 'shipped' && (
            <MarkDeliveredButton order={order} size="sm" stopPropagation />
          )}
          {order.status === 'delivered' && (
            <div onClick={stopCardClick}>
              <LinkButton
                to={`/orders/${order.id}/acceptance`}
                size="sm"
                icon={<PackageCheck className="size-3.5" />}
              >
                Принять
              </LinkButton>
            </div>
          )}
        </>
      )}
      <Button
        size="sm"
        variant="secondary"
        icon={<MessageSquare className="size-3.5" />}
        onClick={(event) => {
          stopCardClick(event);
          openChat();
        }}
      >
        Чат
      </Button>
    </div>
  );

  return (
    <article
      onClick={openOrder}
      className={cn(
        'card cursor-pointer transition-shadow hover:border-brand-200 hover:shadow-hover',
        compact ? 'p-5' : 'p-4',
        overdue && 'border-danger-100',
        order.status === 'delivered' && 'border-warn-100',
        isSeller && order.status === 'sent' && 'border-brand-200',
      )}
    >
      {compact ? (
        <div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex min-w-0 flex-1 items-end gap-3">
                {logoName && (
                  <SupplierLogo
                    name={logoName}
                    hue={logoHue}
                    className="size-14 shrink-0 rounded-lg aspect-square text-base"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-ink-900">{order.number}</span>
                    <StatusBadge status={order.status} size="sm" />
                    {overdue && (
                      <Badge tone="danger" size="sm" icon={<AlertTriangle className="size-3" />}>
                        Просрочена
                      </Badge>
                    )}
                  </div>
                  {isSeller ? (
                    <p className="mt-0.5 truncate text-[13px] text-ink-600">{counterpartyName}</p>
                  ) : (
                    <Link
                      to={`/suppliers/${order.supplierId}`}
                      onClick={stopCardClick}
                      className="mt-0.5 block truncate text-[13px] text-ink-600 hover:text-brand-600"
                    >
                      {counterpartyName}
                    </Link>
                  )}
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
                {(outlet?.phone || (!isSeller && supplier)) && (
                  <div className="flex min-w-0 items-center gap-1">
                    <Phone className="size-3 shrink-0 text-ink-400" />
                    <p className="min-w-0 truncate">
                      {(outlet?.contactName || (!isSeller && supplier?.contacts.manager)) && (
                        <span className="font-medium text-ink-700">
                          {outlet?.contactName ?? supplier?.contacts.manager}
                        </span>
                      )}
                      {(outlet?.contactName || (!isSeller && supplier?.contacts.manager)) &&
                        (outlet?.phone || supplier?.contacts.phone) && (
                          <span className="text-ink-500"> · </span>
                        )}
                      {(outlet?.phone || supplier?.contacts.phone) && (
                        <a
                          href={`tel:${(outlet?.phone ?? supplier?.contacts.phone ?? '').replace(/\s|\(|\)|-/g, '')}`}
                          onClick={stopCardClick}
                          className="hover:text-brand-600"
                        >
                          {outlet?.phone ?? supplier?.contacts.phone}
                        </a>
                      )}
                    </p>
                  </div>
                )}
              </dl>

              {renderActions()}
            </div>
          </div>

          <DeliveryTrackerMini order={order} className="mt-5" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[3.5rem_minmax(0,1fr)_auto] lg:items-start lg:gap-x-4">
            {logoName && (
              <SupplierLogo
                name={logoName}
                hue={logoHue}
                className="size-14 sm:col-start-1 sm:row-start-1 lg:col-start-1 lg:row-start-1"
              />
            )}
            <div className="min-w-0 sm:col-start-2 sm:row-start-1 lg:col-start-2 lg:row-start-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-ink-900">{order.number}</span>
                <StatusBadge status={order.status} size="sm" />
                {overdue && (
                  <Badge tone="danger" size="sm" icon={<AlertTriangle className="size-3" />}>
                    Просрочена
                  </Badge>
                )}
              </div>
              {isSeller ? (
                <p className="mt-0.5 text-[13px] text-ink-600">{counterpartyName}</p>
              ) : (
                <Link
                  to={`/suppliers/${order.supplierId}`}
                  onClick={stopCardClick}
                  className="mt-0.5 block text-[13px] text-ink-600 hover:text-brand-600"
                >
                  {counterpartyName}
                </Link>
              )}
              <p className="mt-1 text-xs text-ink-500">
                {withCount(order.lines.length, 'позиция', 'позиции', 'позиций')} ·{' '}
                {order.lines
                  .slice(0, 2)
                  .map((l) => l.name)
                  .join(', ')}
                {order.lines.length > 2 ? ` и ещё ${order.lines.length - 2}` : ''}
              </p>
            </div>

            <dl className="space-y-1 text-[12px] text-ink-600 sm:col-span-2 sm:row-start-2 lg:col-span-2 lg:col-start-1 lg:row-start-2">
              <div className="flex min-w-0 items-start gap-1">
                <MapPin className="mt-0.5 size-3 shrink-0 text-ink-400" />
                <div className="min-w-0">
                  <p className="font-medium text-ink-700">{outlet?.name}</p>
                  <p className="text-[11px] text-ink-500">{order.deliveryAddress}</p>
                </div>
              </div>
              {(outlet?.phone || (!isSeller && supplier?.contacts.phone)) && (
                <div className="flex min-w-0 items-center gap-1">
                  <Phone className="size-3 shrink-0 text-ink-400" />
                  <p className="min-w-0 truncate">
                    {(outlet?.contactName || (!isSeller && supplier?.contacts.manager)) && (
                      <span className="font-medium text-ink-700">
                        {outlet?.contactName ?? supplier?.contacts.manager}
                      </span>
                    )}
                    {(outlet?.contactName || (!isSeller && supplier?.contacts.manager)) &&
                      (outlet?.phone || supplier?.contacts.phone) && (
                        <span className="text-ink-500"> · </span>
                      )}
                    {(outlet?.phone || supplier?.contacts.phone) && (
                      <a
                        href={`tel:${(outlet?.phone ?? supplier?.contacts.phone ?? '').replace(/\s|\(|\)|-/g, '')}`}
                        onClick={stopCardClick}
                        className="hover:text-brand-600"
                      >
                        {outlet?.phone ?? supplier?.contacts.phone}
                      </a>
                    )}
                  </p>
                </div>
              )}
            </dl>

            <div className="flex min-h-[8.5rem] flex-col sm:col-span-2 sm:row-start-3 sm:text-left lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:text-right">
              <div>
                <p className="text-[17px] font-bold text-ink-900">{money(totals.factTotal)}</p>
                <p className="text-xs text-ink-500">
                  {order.deliveryFee === 0 ? 'доставка бесплатно' : `доставка ${money(order.deliveryFee)}`}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[12px] text-ink-600 sm:justify-start lg:justify-end">
                  <Clock className="size-3.5 shrink-0 text-ink-400" />
                  <span>{order.deliveryWindow}</span>
                </p>
              </div>
              {renderActions(true)}
            </div>
          </div>

          <DeliveryTrackerMini order={order} className="mt-3" />
        </>
      )}
    </article>
  );
}
