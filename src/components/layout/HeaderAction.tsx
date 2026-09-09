import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function HeaderAction({
  to,
  icon,
  label,
  badge,
  badgeTone = 'danger',
  className,
  matchPrefix = false,
  isActive,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  badgeTone?: 'danger' | 'neutral';
  className?: string;
  matchPrefix?: boolean;
  isActive?: (active: boolean, location: { pathname: string }) => boolean;
}) {
  return (
    <NavLink
      to={to}
      end={!matchPrefix}
      isActive={isActive}
      className={({ isActive: active }) =>
        cn(
          'relative flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors',
          active
            ? 'bg-brand-50 font-semibold text-brand-700'
            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
          className,
        )
      }
    >
      {icon}
      <span className="hidden text-[11px] whitespace-nowrap lg:block">{label}</span>
      {badge ? (
        <span
          className={cn(
            'absolute top-0 right-1 flex min-w-4 justify-center rounded-full px-1 text-[10px] leading-4 font-bold',
            badgeTone === 'danger' ? 'bg-danger-500 text-white' : 'bg-ink-200 text-ink-700',
          )}
        >
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}
