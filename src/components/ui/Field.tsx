import { forwardRef } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const controlBase =
  'w-full bg-white border border-ink-300 rounded-lg text-sm text-ink-800 placeholder:text-ink-400 ' +
  'transition-colors hover:border-ink-400 focus:border-brand-500 focus:outline-2 ' +
  'focus:outline-offset-0 focus:outline-brand-200 disabled:bg-ink-50 disabled:text-ink-400';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, required, children, className }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-ink-700">
          {label}
          {required && <span className="text-danger-500">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-danger-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-500">{hint}</span>
      ) : null}
    </label>
  );
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leading, trailing, ...rest },
  ref,
) {
  if (leading || trailing) {
    return (
      <span
        className={cn(
          'flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-3 transition-colors',
          'focus-within:border-brand-500 focus-within:outline-2 focus-within:outline-brand-200',
          invalid && 'border-danger-500',
          className,
        )}
      >
        {leading && <span className="text-ink-400">{leading}</span>}
        <input
          ref={ref}
          className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400"
          {...rest}
        />
        {trailing && <span className="text-xs text-ink-500">{trailing}</span>}
      </span>
    );
  }
  return (
    <input
      ref={ref}
      className={cn(controlBase, 'h-10 px-3', invalid && 'border-danger-500', className)}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 3, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(controlBase, 'resize-y px-3 py-2', invalid && 'border-danger-500', className)}
      {...rest}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        controlBase,
        'h-10 cursor-pointer appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27 fill=%27%236b7686%27%3E%3Cpath d=%27M4.2 6.3 8 10l3.8-3.7z%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-8 pl-3',
        invalid && 'border-danger-500',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
});

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  count?: number;
}

export function Checkbox({ label, count, className, ...rest }: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 py-1 text-sm text-ink-700 select-none hover:text-ink-900',
        rest.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        type="checkbox"
        className="size-4 shrink-0 cursor-pointer accent-brand-600"
        {...rest}
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-ink-400">{count}</span>}
    </label>
  );
}

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
}

export function Radio({ label, description, className, ...rest }: RadioProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors',
        rest.checked
          ? 'border-brand-500 bg-brand-50'
          : 'border-ink-200 bg-white hover:border-ink-300',
        className,
      )}
    >
      <input type="radio" className="mt-0.5 size-4 cursor-pointer accent-brand-600" {...rest} />
      <span className="flex-1">
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-500">{description}</span>}
      </span>
    </label>
  );
}

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

export function Switch({ label, className, ...rest }: SwitchProps) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2.5 text-sm', className)}>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" {...rest} />
        <span className="absolute inset-0 rounded-full bg-ink-300 transition-colors peer-checked:bg-brand-600" />
        <span className="absolute left-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
      {label && <span className="text-ink-700">{label}</span>}
    </label>
  );
}
