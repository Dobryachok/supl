import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { TD, TH, THead, TR, Table } from '@/components/ui/Table';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { cn } from '@/lib/cn';
import { dateShort, isoDate, money, orderStatusLabels, relativeDay, startOfToday } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { isOverdue, orderTotals } from '@/store/selectors';
import type { Order, OrderStatus } from '@/types';
import { StatusBadge } from './StatusBadge';

type SortColumn = 'order' | 'supplier' | 'composition' | 'delivery' | 'amount' | 'status';
type SortState = { column: SortColumn; direction: 'desc' | 'asc' } | null;

const statusRank: Record<OrderStatus, number> = {
  draft: 0,
  sent: 1,
  confirmed: 2,
  shipped: 3,
  delivered: 4,
  accepted: 5,
  partially_accepted: 6,
  refused: 7,
  rejected: 8,
  cancelled: 9,
};

function nextSortState(column: SortColumn, current: SortState): SortState {
  if (current?.column !== column) return { column, direction: 'desc' };
  if (current.direction === 'desc') return { column, direction: 'asc' };
  return null;
}

function SortableHeader({
  label,
  column,
  sort,
  onSort,
  align = 'left',
  width,
}: {
  label: string;
  column: SortColumn;
  sort: SortState;
  onSort: (column: SortColumn) => void;
  align?: 'left' | 'right';
  width?: string;
}) {
  const active = sort?.column === column;

  return (
    <TH width={width} align={align} className="align-middle">
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'flex w-full cursor-pointer items-center gap-1 text-[11px] leading-none font-semibold tracking-wide uppercase transition-colors hover:text-ink-700',
          align === 'right' ? 'justify-end' : 'justify-start',
          active ? 'text-ink-700' : 'text-ink-500',
        )}
      >
        <span className="leading-none">{label}</span>
        <ChevronDown
          className={cn(
            'size-3 shrink-0 text-ink-400 transition-transform',
            active && sort.direction === 'asc' && 'rotate-180',
            active && 'text-ink-600',
          )}
          aria-hidden
        />
      </button>
    </TH>
  );
}

export function OrdersTable({ orders, base = '/orders' }: { orders: Order[]; base?: string }) {
  const state = useAppState();
  const navigate = useNavigate();
  const today = isoDate(startOfToday());
  const [sort, setSort] = useState<SortState>(null);

  const sortedOrders = useMemo(() => {
    if (!sort) return orders;

    const list = [...orders];
    const direction = sort.direction === 'desc' ? -1 : 1;

    list.sort((a, b) => {
      let result = 0;

      switch (sort.column) {
        case 'order':
          result = a.createdAt.localeCompare(b.createdAt);
          break;
        case 'supplier':
          result = a.supplierName.localeCompare(b.supplierName, 'ru');
          break;
        case 'composition':
          result = a.lines.length - b.lines.length;
          if (result === 0) {
            result = (a.lines[0]?.name ?? '').localeCompare(b.lines[0]?.name ?? '', 'ru');
          }
          break;
        case 'delivery':
          result = a.deliveryDate.localeCompare(b.deliveryDate);
          break;
        case 'amount':
          result = orderTotals(a).total - orderTotals(b).total;
          break;
        case 'status':
          result = statusRank[a.status] - statusRank[b.status];
          if (result === 0) {
            result = orderStatusLabels[a.status].localeCompare(orderStatusLabels[b.status], 'ru');
          }
          break;
      }

      return result * direction;
    });

    return list;
  }, [orders, sort]);

  const handleSort = (column: SortColumn) => {
    setSort((current) => nextSortState(column, current));
  };

  return (
    <Table>
      <THead>
        <TR>
          <SortableHeader label="Заявка" column="order" sort={sort} onSort={handleSort} width="17%" />
          <SortableHeader
            label="Поставщик"
            column="supplier"
            sort={sort}
            onSort={handleSort}
            width="20%"
          />
          <SortableHeader label="Состав" column="composition" sort={sort} onSort={handleSort} />
          <SortableHeader
            label="Доставка"
            column="delivery"
            sort={sort}
            onSort={handleSort}
            width="15%"
          />
          <SortableHeader
            label="Сумма"
            column="amount"
            sort={sort}
            onSort={handleSort}
            align="right"
            width="12%"
          />
          <SortableHeader label="Статус" column="status" sort={sort} onSort={handleSort} width="16%" />
          <TH width="4%" className="align-middle" />
        </TR>
      </THead>
      <tbody>
        {sortedOrders.map((order) => {
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
