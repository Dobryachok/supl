import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select, toolbarInputShellClass, toolbarSelectClass } from '@/components/ui/Field';
import { RowsSkeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { DeliveryCard } from '@/components/orders/DeliveryCard';
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad';
import { cn } from '@/lib/cn';
import { useAppState } from '@/store/AppContext';
import { sellerOrders } from '@/store/selectors';
import type { OrderStatus } from '@/types';

const tabs: { id: string; label: string; statuses: OrderStatus[] }[] = [
  { id: 'new', label: 'Новые', statuses: ['sent'] },
  { id: 'work', label: 'В работе', statuses: ['confirmed', 'shipped'] },
  { id: 'delivered', label: 'Доставлены', statuses: ['delivered'] },
  {
    id: 'closed',
    label: 'Закрытые',
    statuses: ['accepted', 'partially_accepted', 'refused', 'rejected', 'cancelled'],
  },
];

export function SellerOrdersPage() {
  const state = useAppState();
  const [searchParams] = useSearchParams();
  const loading = useSimulatedLoad([state.session.sellerSupplierId]);
  const statusParam = searchParams.get('status') as OrderStatus | null;
  const [tab, setTab] = useState(
    statusParam ? (tabs.find((t) => t.statuses.includes(statusParam))?.id ?? 'all') : 'new',
  );
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'created' | 'delivery'>('delivery');

  const orders = sellerOrders(state);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const statuses = tabs.find((t) => t.id === tab)?.statuses;
    return orders
      .filter((order) => {
        if (statuses && !statuses.includes(order.status)) return false;
        if (q) {
          const haystack = `${order.number} ${order.lines.map((l) => l.name).join(' ')}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) =>
        sort === 'delivery'
          ? a.deliveryDate.localeCompare(b.deliveryDate)
          : b.createdAt.localeCompare(a.createdAt),
      );
  }, [orders, tab, query, sort]);

  return (
    <div>
      <div>
        <h1 className="text-[26px]">Заявки от ресторанов</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Подтверждайте состав, назначайте машину и отмечайте статусы доставки
        </p>
      </div>

      <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Номер заявки или товар"
          leading={<Search className="size-4" />}
          className={cn(toolbarInputShellClass, 'min-w-0 w-full flex-1 basis-48')}
          aria-label="Поиск заявок"
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'created' | 'delivery')}
          className={cn(toolbarSelectClass, '!flex-none w-full shrink-0 sm:w-44')}
          aria-label="Сортировка"
        >
          <option value="delivery">По дате доставки</option>
          <option value="created">По дате создания</option>
        </Select>
      </div>

      <Tabs
        className="mt-3 min-w-0"
        value={tab}
        onChange={setTab}
        variant="pills"
        items={[
          ...tabs.map((item) => ({
            id: item.id,
            label: item.label,
            count: orders.filter((o) => item.statuses.includes(o.status)).length,
          })),
          { id: 'all', label: 'Все', count: orders.length },
        ]}
      />

      <div className="mt-4">
        {loading ? (
          <RowsSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            title="Заявок по фильтрам нет"
            text="Переключите статус или измените поиск — или дождитесь новых заявок от ресторанов."
            compact
          />
        ) : (
          <div className="space-y-2.5">
            {filtered.map((order) => (
              <DeliveryCard key={order.id} order={order} role="seller" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
