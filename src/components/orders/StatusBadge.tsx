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
import { Badge } from '@/components/ui/Badge';
import { orderStatusLabels, orderStatusTones } from '@/lib/format';
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
    <Badge tone={orderStatusTones[status]} icon={statusIcons[status]} size={size}>
      {orderStatusLabels[status]}
    </Badge>
  );
}
