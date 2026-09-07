import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, Download, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { KpiBar } from '@/components/orders/KpiBar';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { StatusFunnel } from '@/components/orders/StatusFunnel';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { dateFull, money, verdictLabels, withCount } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import {
  activeStatuses,
  closedStatuses,
  isOverdue,
  ordersKpi,
  orderTotals,
  statusCounts,
} from '@/store/selectors';
import type { OrderStatus } from '@/types';

export function OrdersPage() {
  const state = useAppState();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const loading = useSimulatedLoad([]);

  const [tab, setTab] = useState(searchParams.get('tab') ?? 'active');
  const [status, setStatus] = useState<OrderStatus | 'all'>(
    (searchParams.get('status') as OrderStatus) ?? 'all',
  );
  const [kpiFilter, setKpiFilter] = useState<string | undefined>(
    searchParams.get('overdue') ? 'overdue' : undefined,
  );
  const [query, setQuery] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [period, setPeriod] = useState<DateRange>({ from: '', to: '' });

  const kpi = ordersKpi(state);
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
        if (tab === 'active' && !activeStatuses.includes(order.status)) return false;
        if (tab === 'closed' && !closedStatuses.includes(order.status)) return false;
        if (status !== 'all' && order.status !== status) return false;
        if (supplierId && order.supplierId !== supplierId) return false;
        if (kpiFilter === 'overdue' && !isOverdue(order)) return false;
        if (kpiFilter === 'today' && order.deliveryDate !== new Date().toISOString().slice(0, 10))
          return false;
        if (kpiFilter === 'inWork' && !activeStatuses.includes(order.status)) return false;
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
  }, [state.orders, tab, status, supplierId, kpiFilter, period, query]);

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
    setKpiFilter(undefined);
    setQuery('');
    setSupplierId('');
    setPeriod({ from: '', to: '' });
    setSearchParams({});
  };

  return (
    <div className="page pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-600 uppercase">
            Операционный контур
          </p>
          <h1 className="mt-0.5 text-[28px]">Поставки</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Номер, поставщик, продукт"
            leading={<Search className="size-4" />}
            className="w-full sm:w-72"
          />
          <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv}>
            CSV
          </Button>
          <LinkButton to="/catalog" icon={<Plus className="size-4" />}>
            Новая заявка
          </LinkButton>
        </div>
      </div>

      <div className="mt-4">
        <KpiBar
          kpi={kpi}
          active={kpiFilter}
          onSelect={(key) => {
            setKpiFilter((prev) => (prev === key ? undefined : key));
            if (key === 'acts') setTab('acts');
            else if (tab === 'acts') setTab('active');
          }}
        />
      </div>

      <div className="mt-3">
        <StatusFunnel
          counts={counts}
          total={state.orders.length}
          value={status}
          onChange={(next) => {
            setStatus(next);
            if (next !== 'all' && !activeStatuses.includes(next as OrderStatus)) setTab('all');
          }}
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          variant="pills"
          className="min-w-0 flex-1"
          items={[
            {
              id: 'active',
              label: 'Активные',
              count: state.orders.filter((o) => activeStatuses.includes(o.status)).length,
            },
            { id: 'all', label: 'Все заявки', count: state.orders.length },
            {
              id: 'closed',
              label: 'Закрытые',
              count: state.orders.filter((o) => closedStatuses.includes(o.status)).length,
            },
            { id: 'acts', label: 'Акты расхождений', count: state.acts.length },
          ]}
        />
        <div className="flex shrink-0 items-center gap-2">
          <DateRangeFilter value={period} onChange={setPeriod} className="shrink-0" />
          <Select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="h-9 w-44 shrink-0 text-[13px] sm:w-52"
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

      {tab === 'acts' ? (
        <div className="mt-4 space-y-3">
          {state.acts.length === 0 ? (
            <EmptyState
              title="Актов расхождений нет"
              text="Все поставки принимались в полном объёме — это хороший знак."
              compact
            />
          ) : (
            state.acts.map((act) => {
              const order = state.orders.find((o) => o.id === act.orderId);
              const supplier = state.suppliers.find((s) => s.id === act.supplierId);
              return (
                <div key={act.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink-900">{act.number}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {dateFull(act.createdAt)} · принимал {act.acceptedBy} ·{' '}
                        {supplier?.name ?? ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={act.verdict === 'accepted' ? 'success' : 'warn'}>
                        {verdictLabels[act.verdict]}
                      </Badge>
                      {order && (
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-[13px] font-medium text-brand-600 hover:underline"
                        >
                          {order.number}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-ink-50 p-3">
                      <p className="text-[11px] tracking-wide text-ink-500 uppercase">По заявке</p>
                      <p className="text-[15px] font-bold text-ink-900">
                        {money(act.plannedAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-success-50 p-3">
                      <p className="text-[11px] tracking-wide text-success-700 uppercase">
                        Принято
                      </p>
                      <p className="text-[15px] font-bold text-success-700">
                        {money(act.acceptedAmount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-warn-50 p-3">
                      <p className="text-[11px] tracking-wide text-warn-600 uppercase">
                        Расхождение
                      </p>
                      <p className="text-[15px] font-bold text-warn-600">
                        {money(act.discrepancyAmount)}
                      </p>
                    </div>
                  </div>

                  {act.comment && <p className="mt-3 text-[13px] text-ink-600">{act.comment}</p>}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[15px]">
              {tab === 'active' ? 'Активные заявки' : tab === 'closed' ? 'Закрытые заявки' : 'Все заявки'}
            </h2>
            <span className="text-[13px] text-ink-500">
              {withCount(filtered.length, 'в выборке', 'в выборке', 'в выборке')}
            </span>
            {(status !== 'all' || kpiFilter || supplierId || period.from || period.to || query) && (
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
      )}
    </div>
  );
}
