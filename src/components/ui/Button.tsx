import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'subtle'
  | 'success'
  | 'danger'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
  secondary: 'bg-white text-ink-800 border border-ink-300 hover:border-ink-400 hover:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-800',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  success: 'bg-success-500 text-white hover:bg-success-600 shadow-sm',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 shadow-sm',
  link: 'text-brand-600 hover:text-brand-700 hover:underline px-0',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl font-semibold',
  icon: 'h-9 w-9 rounded-lg',
};

const base =
  'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors ' +
  'disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-brand-400 cursor-pointer';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, block, icon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      {...rest}
      disabled={rest.disabled || loading}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});

export interface LinkButtonProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
  state?: unknown;
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  block,
  icon,
  className,
  children,
  state,
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      state={state as never}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
    >
      {icon}
      {children}
    </Link>
  );
}
