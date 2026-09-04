import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('scroll-thin w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[720px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-ink-50 text-[11px] tracking-wide text-ink-500 uppercase">{children}</thead>;
}

export function TH({
  children,
  align = 'left',
  className,
  width,
}: {
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  width?: string;
}) {
  return (
    <th
      style={width ? { width } : undefined}
      className={cn(
        'border-b border-ink-200 px-3 py-2.5 font-semibold',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TR({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-ink-100 last:border-0',
        onClick && 'cursor-pointer hover:bg-brand-50/40',
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  align = 'left',
  className,
  colSpan,
}: {
  children?: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-3 py-3 align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}
