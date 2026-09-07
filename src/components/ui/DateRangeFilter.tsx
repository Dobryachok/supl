import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { dateShort } from '@/lib/format';

export interface DateRange {
  from: string;
  to: string;
}

const emptyRange: DateRange = { from: '', to: '' };

export function DateRangeFilter({
  value,
  onChange,
  className,
}: {
  value: DateRange;
  onChange: (value: DateRange) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = Boolean(value.from || value.to);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const apply = () => {
    let { from, to } = draft;
    if (from && to && from > to) [from, to] = [to, from];
    onChange({ from, to });
    setOpen(false);
  };

  const clear = () => {
    onChange(emptyRange);
    setDraft(emptyRange);
    setOpen(false);
  };

  const title = active
    ? `${value.from ? dateShort(value.from) : '…'} — ${value.to ? dateShort(value.to) : '…'}`
    : 'Выбрать период';

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant={active ? 'subtle' : 'secondary'}
        size="icon"
        aria-label={title}
        title={title}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <CalendarDays className="size-4" />
      </Button>

      {open && (
        <div
          className="absolute top-full right-0 z-20 mt-1.5 w-72 rounded-xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-pop)]"
          role="dialog"
          aria-label="Период"
        >
          <p className="text-[13px] font-semibold text-ink-900">Период</p>
          <p className="mt-0.5 text-xs text-ink-500">По дате создания заявки</p>
          <div className="mt-3 space-y-3">
            <Field label="С">
              <Input
                type="date"
                value={draft.from}
                onChange={(e) => setDraft((prev) => ({ ...prev, from: e.target.value }))}
                className="h-9 text-[13px]"
              />
            </Field>
            <Field label="По">
              <Input
                type="date"
                value={draft.to}
                onChange={(e) => setDraft((prev) => ({ ...prev, to: e.target.value }))}
                className="h-9 text-[13px]"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Сбросить
            </Button>
            <Button type="button" size="sm" onClick={apply}>
              Применить
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
