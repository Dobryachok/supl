import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  FileEdit,
  PackageCheck,
  Send,
  ThumbsDown,
  Truck,
  XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { orderStatusLabels } from '@/lib/format';
import { orderStatusStyles } from '@/lib/orderStatusStyles';
import type { OrderStatus } from '@/types';

export const statusIcons: Record<OrderStatus, ReactNode> = {
  draft: <FileEdit className="size-3.5" />,
  sent: <Send className="size-3.5" />,
  confirmed: <CheckCircle2 className="size-3.5" />,
  rejected: <XCircle className="size-3.5" />,
  shipped: <Truck className="size-3.5" />,
  delivered: <PackageCheck className="size-3.5" />,
  accepted: <ClipboardCheck className="size-3.5" />,
  partially_accepted: <ClipboardCheck className="size-3.5" />,
  refused: <ThumbsDown className="size-3.5" />,
  cancelled: <Ban className="size-3.5" />,
};

export function StatusBadge({ status, size }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        orderStatusStyles[status].badge,
      )}
    >
      {statusIcons[status]}
      {orderStatusLabels[status]}
    </span>
  );
}

export function OrderStatusDot({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn('inline-block size-2 shrink-0 rounded-full', orderStatusStyles[status].dot, className)}
    />
  );
}
