import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { cn } from '@/lib/cn';
import {
  type DeliveryCalendarFilters,
  type DeliveryCalendarStatusFilter,
  emptyDeliveryCalendarFilters,
} from '@/store/selectors';
import type { Outlet, Supplier } from '@/types';

const statusOptions: { value: DeliveryCalendarStatusFilter; label: string }[] = [
  { value: 'in_transit', label: 'В пути' },
  { value: 'acceptance', label: 'Ждут приёмки' },
  { value: 'overdue', label: 'Просроченные' },
  { value: 'closed', label: 'Завершённые' },
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
    filters.statuses.length > 0 ||
    filters.supplierIds.length > 0 ||
    filters.outletIds.length > 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <MultiSelect
        prefix="Статус"
        placeholder="Все статусы"
        options={statusOptions}
        value={filters.statuses}
        onChange={(statuses) => patch({ statuses: statuses as DeliveryCalendarStatusFilter[] })}
        className="min-w-[10rem] flex-1"
      />
      <MultiSelect
        prefix="Поставщик"
        placeholder="Все поставщики"
        options={suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))}
        value={filters.supplierIds}
        onChange={(supplierIds) => patch({ supplierIds })}
        className="min-w-[10rem] flex-1"
      />
      <MultiSelect
        prefix="Точка"
        placeholder="Все точки"
        options={outlets.map((outlet) => ({ value: outlet.id, label: outlet.name }))}
        value={filters.outletIds}
        onChange={(outletIds) => patch({ outletIds })}
        className="min-w-[10rem] flex-1"
      />
      <Button
        type="button"
        variant="secondary"
        size="md"
        className="shrink-0"
        icon={<RotateCcw className="size-4 text-ink-400" />}
        onClick={reset}
        disabled={!hasActive}
      >
        Сбросить
      </Button>
    </div>
  );
}
