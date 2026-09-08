import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, Switch } from '@/components/ui/Field';
import { Tabs } from '@/components/ui/Tabs';
import { cn } from '@/lib/cn';
import {
  type DeliveryCalendarFilters,
  emptyDeliveryCalendarFilters,
} from '@/store/selectors';
import type { Outlet, Supplier } from '@/types';

const statusTabs = [
  { id: 'all', label: 'Все' },
  { id: 'in_transit', label: 'В пути' },
  { id: 'acceptance', label: 'Ждут приёмки' },
  { id: 'overdue', label: 'Просроченные' },
  { id: 'closed', label: 'Завершённые' },
];

export function DeliveryCalendarFilters({
  filters,
  suppliers,
  outlets,
  onChange,
  className,
}: {
  filters: DeliveryCalendarFilters;
  suppliers: Supplier[];
  outlets: Outlet[];
  onChange: (filters: DeliveryCalendarFilters) => void;
  className?: string;
}) {
  const patch = (part: Partial<DeliveryCalendarFilters>) => onChange({ ...filters, ...part });

  const reset = () => onChange(emptyDeliveryCalendarFilters);

  const hasActive =
    filters.status !== 'all' ||
    Boolean(filters.supplierId) ||
    Boolean(filters.outletId) ||
    filters.includeClosed;

  return (
    <div className={cn('card space-y-3 p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-ink-900">Фильтры</p>
        {hasActive && (
          <Button type="button" variant="ghost" size="sm" icon={<RotateCcw className="size-3.5" />} onClick={reset}>
            Сбросить
          </Button>
        )}
      </div>

      <Tabs
        variant="pills"
        value={filters.status}
        onChange={(id) => patch({ status: id as DeliveryCalendarFilters['status'] })}
        items={statusTabs}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[10rem] flex-1">
          <label className="mb-1 block text-[11px] font-medium text-ink-500">Поставщик</label>
          <Select
            value={filters.supplierId}
            onChange={(e) => patch({ supplierId: e.target.value })}
            className="h-9 text-[13px]"
          >
            <option value="">Все поставщики</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>

        <div className="min-w-[10rem] flex-1">
          <label className="mb-1 block text-[11px] font-medium text-ink-500">Точка</label>
          <Select
            value={filters.outletId}
            onChange={(e) => patch({ outletId: e.target.value })}
            className="h-9 text-[13px]"
          >
            <option value="">Все точки</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        </div>

        <Switch
          checked={filters.includeClosed}
          onChange={(e) => patch({ includeClosed: e.target.checked })}
          label="Показать завершённые"
        />
      </div>
    </div>
  );
}
