import { Truck } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { DeliveryCard } from '@/components/orders/DeliveryCard';
import { dateFull, money, weekday, withCount } from '@/lib/format';
import { orderTotals } from '@/store/selectors';
import type { Order } from '@/types';

export function DeliveryDayPanel({ date, orders }: { date: string; orders: Order[] }) {
  const total = orders.reduce((sum, o) => sum + orderTotals(o).total, 0);

  return (
    <div className="card flex min-w-0 flex-col p-4 lg:sticky lg:top-[calc(var(--header-offset,5rem)+1rem)] lg:max-h-[calc(100vh-var(--header-offset,5rem)-2rem)] lg:overflow-y-auto">
      <div className="shrink-0">
        <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">Выбранный день</p>
        <h2 className="mt-0.5 text-[17px] font-bold text-ink-900">
          {dateFull(date)}, {weekday(date)}
        </h2>
        {orders.length > 0 ? (
          <p className="mt-1 text-[13px] text-ink-500">
            {withCount(orders.length, 'поставка', 'поставки', 'поставок')} · {money(total)}
          </p>
        ) : (
          <p className="mt-1 text-[13px] text-ink-500">Нет поставок в выбранной выборке</p>
        )}
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-2.5">
        {orders.length === 0 ? (
          <EmptyState
            icon={<Truck className="size-5" />}
            title="На этот день пусто"
            text="Выберите другой день или измените фильтры."
          />
        ) : (
          orders.map((order) => <DeliveryCard key={order.id} order={order} compact />)
        )}
      </div>
    </div>
  );
}
