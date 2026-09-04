import type { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon, title, text, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-300 bg-white text-center',
        compact ? 'gap-2 px-6 py-8' : 'gap-3 px-6 py-14',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
        {icon ?? <PackageOpen className="size-6" />}
      </span>
      <h3 className="text-[15px]">{title}</h3>
      {text && <p className="max-w-md text-[13px] text-ink-500">{text}</p>}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
