import { useMemo, useState } from 'react';
import { ClipboardList, Download, Plus, Search } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/Button';
import type { DateRange } from '@/components/ui/DateRangeFilter';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select, toolbarInputShellClass, toolbarSelectClass } from '@/components/ui/Field';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { StatusFunnel } from '@/components/orders/StatusFunnel';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { cn } from '@/lib/cn';
import { withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import { orderTotals, statusCounts } from '@/store/selectors';
import type { OrderStatus } from '@/types';

export function OrdersPage() {
  const state = useAppState();
  const toast = useToast();
  const loading = useSimulatedLoad([]);

  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [period, setPeriod] = useState<DateRange>({ from: '', to: '' });

  const counts = statusCounts(state.orders);

  const orderSuppliers = useMemo(() => {
    const supplierIds = new Set(
      state.orders.filter((order) => order.status !== 'draft').map((order) => order.supplierId),
    );
    return state.suppliers
      .filter((supplier) => supplierIds.has(supplier.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [state.orders, state.suppliers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.orders
      .filter((order) => {
        if (status !== 'all' && order.status !== status) return false;
        if (supplierId && order.supplierId !== supplierId) return false;
        if (period.from || period.to) {
          const orderDate = order.createdAt.slice(0, 10);
          if (period.from && orderDate < period.from) return false;
          if (period.to && orderDate > period.to) return false;
        }
        if (q) {
          const haystack = `${order.number} ${order.supplierName} ${order.lines
            .map((l) => `${l.name} ${l.article}`)
            .join(' ')}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.orders, status, supplierId, period, query]);

  const exportCsv = () => {
    const header = ['Заявка', 'Поставщик', 'Статус', 'Доставка', 'Позиций', 'Сумма'];
    const rows = filtered.map((order) => [
      order.number,
      order.supplierName,
      order.status,
      order.deliveryDate,
      String(order.lines.length),
      String(orderTotals(order).total),
    ]);
    const csv = [header, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zayavki.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Выгрузка готова', `${filtered.length} заявок в CSV`);
  };

  const resetFilters = () => {
    setStatus('all');
    setQuery('');
    setSupplierId('');
    setPeriod({ from: '', to: '' });
  };

  return (
    <div className="page pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-600 uppercase">
            Операционный контур
          </p>
          <h1 className="mt-0.5 text-[28px]">Заявки</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv}>
            CSV
          </Button>
          <LinkButton to="/catalog" icon={<Plus className="size-4" />}>
            Новая заявка
          </LinkButton>
        </div>
      </div>

      <div className="mt-4">
        <StatusFunnel
          counts={counts}
          total={state.orders.length}
          value={status}
          onChange={setStatus}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Номер, поставщик, продукт"
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
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className={cn(toolbarSelectClass, 'w-full min-w-[10.5rem] sm:w-48 sm:flex-none')}
            aria-label="Поставщик"
          >
            <option value="">Все поставщики</option>
            {orderSuppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
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
          {(status !== 'all' || supplierId || period.from || period.to || query) && (
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
            text="Измените статус, поставщика или период — или создайте новую заявку."
            action={
              <>
                <Button variant="secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
                <LinkButton to="/catalog">Новая заявка</LinkButton>
              </>
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <OrdersTable orders={filtered} />
          </div>
        )}
      </div>
    </div>
  );
}

const dateControlClass = '!h-10 py-0 text-sm [&_input]:h-full';
