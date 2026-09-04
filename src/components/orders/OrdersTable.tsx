import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { TD, TH, THead, TR, Table } from '@/components/ui/Table';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { cn } from '@/lib/cn';
import { dateShort, isoDate, money, relativeDay, startOfToday } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { isOverdue, orderTotals } from '@/store/selectors';
import type { Order } from '@/types';
import { StatusBadge } from './StatusBadge';

export function OrdersTable({ orders, base = '/orders' }: { orders: Order[]; base?: string }) {
  const state = useAppState();
  const navigate = useNavigate();
  const today = isoDate(startOfToday());

  return (
    <Table>
      <THead>
        <TR>
          <TH width="17%">Заявка</TH>
          <TH width="20%">Поставщик</TH>
          <TH>Состав</TH>
          <TH width="15%">Доставка</TH>
          <TH width="12%" align="right">
            Сумма
          </TH>
          <TH width="16%">Статус</TH>
          <TH width="4%" />
        </TR>
      </THead>
      <tbody>
        {orders.map((order) => {
          const supplier = state.suppliers.find((s) => s.id === order.supplierId);
          const totals = orderTotals(order);
          const overdue = isOverdue(order);
          const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId);
          return (
            <TR key={order.id} onClick={() => navigate(`${base}/${order.id}`)}>
              <TD>
                <Link
                  to={`${base}/${order.id}`}
                  className="text-[13px] font-semibold text-brand-700 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {order.number}
                </Link>
                <p className="text-xs text-ink-500">от {dateShort(order.createdAt)}</p>
              </TD>
              <TD>
                <div className="flex items-center gap-2">
                  {supplier && (
                    <SupplierLogo
                      name={supplier.name}
                      hue={supplier.hue}
                      className="size-8 text-[11px]"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink-900">
                      {order.supplierName}
                    </p>
                    <p className="truncate text-xs text-ink-500">{outlet?.name ?? '—'}</p>
                  </div>
                </div>
              </TD>
              <TD>
                <p className="line-clamp-1 text-[13px] text-ink-700">{order.lines[0]?.name}</p>
                {order.lines.length > 1 && (
                  <p className="text-xs text-ink-500">ещё {order.lines.length - 1}</p>
                )}
              </TD>
              <TD>
                <p
                  className={cn(
                    'flex items-center gap-1 text-[13px] font-semibold',
                    overdue
                      ? 'text-danger-600'
                      : order.deliveryDate === today
                        ? 'text-success-600'
                        : 'text-ink-800',
                  )}
                >
                  {overdue && <AlertTriangle className="size-3.5" />}
                  {dateShort(order.deliveryDate)}
                </p>
                <p className="text-xs text-ink-500">
                  {relativeDay(order.deliveryDate)}, {order.deliveryWindow}
                </p>
              </TD>
              <TD align="right">
                <p className="text-[13px] font-semibold text-ink-900">{money(totals.total)}</p>
                {totals.discrepancy > 0 && (
                  <p className="text-xs text-warn-600">−{money(totals.discrepancy)}</p>
                )}
              </TD>
              <TD>
                <StatusBadge status={order.status} />
              </TD>
              <TD align="right">
                <ChevronRight className="size-4 text-ink-300" />
              </TD>
            </TR>
          );
        })}
      </tbody>
    </Table>
  );
}
