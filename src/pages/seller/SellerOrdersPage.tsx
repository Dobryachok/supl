import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { DateRange } from '@/components/ui/DateRangeFilter';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select, toolbarInputShellClass, toolbarSelectClass } from '@/components/ui/Field';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { StatusFunnel } from '@/components/orders/StatusFunnel';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { cn } from '@/lib/cn';
import { withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { sellerOrders, statusCounts } from '@/store/selectors';
import type { OrderStatus } from '@/types';

function initialStatus(param: OrderStatus | null): OrderStatus | 'all' {
  if (!param) return 'all';
  if (['accepted', 'partially_accepted', 'refused'].includes(param)) return 'accepted';
  if (param === 'cancelled' || param === 'rejected') return 'cancelled';
  return param;
}

function matchesStatusFilter(order: { status: OrderStatus }, status: OrderStatus | 'all') {
  if (status === 'all') return true;
  if (status === 'accepted') {
    return ['accepted', 'partially_accepted', 'refused'].includes(order.status);
  }
  if (status === 'cancelled') {
    return ['cancelled', 'rejected'].includes(order.status);
  }
  return order.status === status;
}

const dateControlClass = '!h-10 py-0 text-sm [&_input]:h-full';

export function SellerOrdersPage() {
  const state = useAppState();
  const [searchParams] = useSearchParams();
  const loading = useSimulatedLoad([state.session.sellerSupplierId]);
  const statusParam = searchParams.get('status') as OrderStatus | null;

  const [status, setStatus] = useState<OrderStatus | 'all'>(() => initialStatus(statusParam));
  const [query, setQuery] = useState('');
  const [outletId, setOutletId] = useState('');
  const [period, setPeriod] = useState<DateRange>({ from: '', to: '' });

  const orders = sellerOrders(state);
  const counts = statusCounts(orders);

  const orderOutlets = useMemo(() => {
    const outletIds = new Set(orders.map((order) => order.outletId));
    return state.restaurant.outlets
      .filter((outlet) => outletIds.has(outlet.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [orders, state.restaurant.outlets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((order) => {
        if (!matchesStatusFilter(order, status)) return false;
        if (outletId && order.outletId !== outletId) return false;
        if (period.from || period.to) {
          const orderDate = order.createdAt.slice(0, 10);
          if (period.from && orderDate < period.from) return false;
          if (period.to && orderDate > period.to) return false;
        }
        if (q) {
          const outlet = state.restaurant.outlets.find((o) => o.id === order.outletId)?.name ?? '';
          const haystack = `${order.number} ${state.restaurant.name} ${outlet} ${order.lines
            .map((l) => `${l.name} ${l.article}`)
            .join(' ')}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [orders, status, outletId, period, query, state.restaurant.name, state.restaurant.outlets]);

  const hasActiveFilters =
    status !== 'all' || outletId || period.from || period.to || query.trim().length > 0;

  const resetFilters = () => {
    setStatus('all');
    setQuery('');
    setOutletId('');
    setPeriod({ from: '', to: '' });
  };

  return (
    <div>
      <div>
        <h1 className="text-[26px]">Заявки от ресторанов</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Подтверждайте состав, назначайте машину и отмечайте статусы доставки
        </p>
      </div>

      <div className="mt-4">
        <StatusFunnel
          counts={counts}
          total={orders.length}
          value={status}
          onChange={setStatus}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Номер, точка, продукт"
          leading={<Search className="size-4" />}
          className={cn(toolbarInputShellClass, 'min-w-0 sm:flex-1')}
          aria-label="Поиск заявок"
        />

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">
          <Input
            type="date"
            leading={<span className="text-sm font-medium text-ink-500">С</span>}
            value={period.from}
            onChange={(e) => setPeriod((prev) => ({ ...prev, from: e.target.value }))}
            className={cn(dateControlClass, 'w-full min-w-[9.5rem] flex-1 px-2.5 sm:w-[10.5rem] sm:flex-none')}
            aria-label="Дата с"
          />
          <Input
            type="date"
            leading={<span className="text-sm font-medium text-ink-500">По</span>}
            value={period.to}
            onChange={(e) => setPeriod((prev) => ({ ...prev, to: e.target.value }))}
            className={cn(dateControlClass, 'w-full min-w-[9.5rem] flex-1 px-2.5 sm:w-[10.5rem] sm:flex-none')}
            aria-label="Дата по"
          />
          <Select
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
            className={cn(toolbarSelectClass, 'w-full min-w-[10.5rem] sm:w-48 sm:flex-none !flex-none')}
            aria-label="Точка ресторана"
          >
            <option value="">Все точки</option>
            {orderOutlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-[15px]">Заявки</h2>
          <span className="text-[13px] text-ink-500">
            {withCount(filtered.length, 'в выборке', 'в выборке', 'в выборке')}
          </span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          )}
        </div>

        {loading ? (
          <RowsSkeleton count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title="Заявок по фильтрам нет"
            text="Измените статус, точку или период — или дождитесь новых заявок от ресторанов."
            action={
              hasActiveFilters ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <OrdersTable orders={filtered} base="/seller/orders" role="seller" />
          </div>
        )}
      </div>
    </div>
  );
}
