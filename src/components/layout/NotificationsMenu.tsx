import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ClipboardCheck, MessageSquare, Package, Truck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/format';
import { useAppState, useDispatch } from '@/store/AppContext';
import type { NotificationKind } from '@/types';

const kindIcons: Record<NotificationKind, ReactNode> = {
  order: <Package className="size-4 text-brand-600" />,
  delivery: <Truck className="size-4 text-frost-500" />,
  chat: <MessageSquare className="size-4 text-ink-500" />,
  act: <ClipboardCheck className="size-4 text-warn-500" />,
  catalog: <Package className="size-4 text-success-500" />,
};

export function NotificationsMenu() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  const items = state.notifications.filter((n) => n.role === state.session.role).slice(0, 12);
  const unread = items.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex cursor-pointer flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-ink-600 hover:bg-ink-100 hover:text-ink-900"
        aria-label="Уведомления"
      >
        <Bell className="size-5" />
        <span className="hidden text-[11px] lg:block">События</span>
        {unread > 0 && (
          <span className="absolute top-0 right-1 flex min-w-4 justify-center rounded-full bg-danger-500 px-1 text-[10px] leading-4 font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute top-full right-0 z-40 mt-1.5 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-xl border border-ink-200 bg-white shadow-[var(--shadow-pop)]">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-ink-900">Уведомления</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'notifications/readAll', role: state.session.role })}
                className="cursor-pointer text-xs font-medium text-brand-600 hover:underline"
              >
                Прочитать все
              </button>
            )}
          </div>
          <div className="scroll-thin max-h-[380px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-500">Пока событий нет</p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  onClick={() => {
                    dispatch({ type: 'notifications/read', id: item.id });
                    setOpen(false);
                  }}
                  className={cn(
                    'flex gap-3 border-b border-ink-100 px-4 py-3 last:border-0 hover:bg-ink-50',
                    !item.read && 'bg-brand-50/50',
                  )}
                >
                  <span className="mt-0.5">{kindIcons[item.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink-900">{item.title}</span>
                      <span className="shrink-0 text-[11px] text-ink-400">
                        {relativeTime(item.at)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[13px] text-ink-600">{item.text}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
