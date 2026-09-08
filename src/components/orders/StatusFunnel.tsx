import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  FileEdit,
  Layers,
  PackageCheck,
  Send,
  Truck,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { orderStatusStyles } from '@/lib/orderStatusStyles';
import type { OrderStatus } from '@/types';

const stages: { status: OrderStatus; label: string; icon: LucideIcon }[] = [
  { status: 'sent', label: 'Отправлены', icon: Send },
  { status: 'confirmed', label: 'Подтверждены', icon: CheckCircle2 },
  { status: 'shipped', label: 'В пути', icon: Truck },
  { status: 'delivered', label: 'Доставлены', icon: PackageCheck },
];

const activeTileStyles: Record<OrderStatus | 'all' | 'accepted' | 'cancelled', string> = {
  all: 'border-ink-900 ring-ink-300',
  draft: 'border-ink-500 ring-ink-200',
  sent: 'border-violet-500 ring-violet-200',
  confirmed: 'border-indigo-500 ring-indigo-200',
  shipped: 'border-sky-500 ring-sky-200',
  delivered: 'border-lime-500 ring-lime-200',
  accepted: 'border-emerald-500 ring-emerald-200',
  cancelled: 'border-ink-500 ring-ink-200',
  rejected: 'border-danger-500 ring-danger-200',
  partially_accepted: 'border-yellow-500 ring-yellow-200',
  refused: 'border-warn-500 ring-warn-200',
};

type FunnelKey = OrderStatus | 'all' | 'accepted' | 'cancelled';

type FunnelTileConfig = {
  key: FunnelKey;
  label: string;
  count: number;
  icon: LucideIcon;
  accentClass: string;
  dividerBefore?: boolean;
};

function FunnelTile({
  label,
  count,
  icon: Icon,
  active,
  onClick,
  accentClass,
  activeKey,
  dividerBefore,
}: {
  label: string;
  count: number;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  accentClass: string;
  activeKey: FunnelKey;
  dividerBefore?: boolean;
}) {
  const hasCount = count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex h-full min-w-0 w-full cursor-pointer flex-col gap-2 rounded-xl border px-2.5 py-2.5 text-left transition-all sm:px-3',
        'hover:border-ink-300 hover:shadow-sm',
        active
          ? cn('bg-white ring-2', activeTileStyles[activeKey])
          : 'border-ink-200 bg-white',
        !hasCount && !active && 'opacity-55',
        dividerBefore && 'border-l-2 border-ink-200 pl-3',
      )}
    >
      <div className="flex h-full min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-start justify-between gap-1.5">
          <span
            className={cn(
              'min-w-0 text-[10px] font-semibold leading-tight tracking-wide uppercase',
              active ? 'text-ink-800' : 'text-ink-500',
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-lg',
              hasCount || active ? accentClass : 'bg-ink-100 text-ink-400',
            )}
          >
            <Icon className="size-3.5" strokeWidth={2.25} />
          </span>
        </div>
        <span className="text-[22px] leading-none font-bold tabular-nums text-ink-900">{count}</span>
      </div>
    </button>
  );
}

export function StatusFunnel({
  counts,
  total,
  value,
  onChange,
}: {
  counts: Record<OrderStatus, number>;
  total: number;
  value: OrderStatus | 'all';
  onChange: (status: OrderStatus | 'all') => void;
}) {
  const closed = counts.accepted + counts.partially_accepted + counts.refused;
  const cancelled = counts.cancelled + counts.rejected;

  const tiles: FunnelTileConfig[] = [
    {
      key: 'all',
      label: 'Весь поток',
      count: total,
      icon: Layers,
      accentClass: 'bg-ink-100 text-ink-700',
    },
    ...stages.map((stage) => ({
      key: stage.status,
      label: stage.label,
      count: counts[stage.status],
      icon: stage.icon,
      accentClass: orderStatusStyles[stage.status].chip,
      dividerBefore: stage.status === 'sent',
    })),
    {
      key: 'accepted',
      label: 'Закрыты',
      count: closed,
      icon: PackageCheck,
      accentClass: orderStatusStyles.accepted.chip,
    },
    {
      key: 'draft',
      label: 'Черновики',
      count: counts.draft,
      icon: FileEdit,
      accentClass: orderStatusStyles.draft.chip,
      dividerBefore: true,
    },
    {
      key: 'cancelled',
      label: 'Отменены',
      count: cancelled,
      icon: XCircle,
      accentClass: 'bg-ink-100 text-ink-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8 xl:gap-3">
        {tiles.map((tile) => (
          <FunnelTile
            key={tile.key}
            label={tile.label}
            count={tile.count}
            icon={tile.icon}
            active={value === tile.key}
            activeKey={tile.key}
            accentClass={tile.accentClass}
            dividerBefore={tile.dividerBefore}
            onClick={() => onChange(tile.key)}
          />
        ))}
    </div>
  );
}
