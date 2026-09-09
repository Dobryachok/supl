import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Field';
import { SupplierLogo } from '@/components/ui/ProductImage';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/format';
import { useAppState } from '@/store/AppContext';

export function ChatsPage() {
  const state = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');

  const threads = [...state.threads]
    .filter((thread) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const supplier = state.suppliers.find((s) => s.id === thread.supplierId);
      return `${thread.subject} ${supplier?.name ?? ''}`.toLowerCase().includes(q);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const activeId = searchParams.get('thread') ?? threads[0]?.id;
  const active = state.threads.find((t) => t.id === activeId);

  useEffect(() => {
    if (!searchParams.get('thread') && threads[0]) {
      setSearchParams({ thread: threads[0].id }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads.length]);

  if (state.threads.length === 0) {
    return (
      <div className="page pt-6">
        <h1 className="text-[26px]">Чаты с поставщиками</h1>
        <div className="mt-4">
          <EmptyState
            icon={<MessageSquare className="size-6" />}
            title="Переписок пока нет"
            text="Задайте вопрос в карточке товара или напишите поставщику из заявки."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page pt-5">
      <h1 className="text-[26px]">Чаты с поставщиками</h1>
      <p className="mt-1 text-[13px] text-ink-500">
        Вопросы по товарам, согласование замен и переписка по заявкам
      </p>

      <div className="card mt-4 grid overflow-hidden lg:grid-cols-[320px_1fr]">
        <div className="border-b border-ink-100 lg:border-r lg:border-b-0">
          <div className="p-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по чатам"
            />
          </div>
          <ul className="scroll-thin max-h-[520px] overflow-y-auto">
            {threads.map((thread) => {
              const supplier = state.suppliers.find((s) => s.id === thread.supplierId);
              const last = thread.messages[thread.messages.length - 1];
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setSearchParams({ thread: thread.id })}
                    className={cn(
                      'flex w-full cursor-pointer gap-3 border-b border-ink-100 p-3 text-left transition-colors',
                      thread.id === activeId ? 'bg-brand-50' : 'hover:bg-ink-50',
                    )}
                  >
                    {supplier && (
                      <SupplierLogo
                        name={supplier.name}
                        hue={supplier.hue}
                        className="size-10 shrink-0"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-ink-900">
                          {supplier?.name}
                        </span>
                        {thread.unreadBuyer > 0 && (
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
                            {thread.unreadBuyer}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-500">
                        {thread.subject}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-400">
                        {last ? last.text : 'Нет сообщений'}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-ink-400">
                        {relativeTime(thread.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-h-[520px] flex-col p-4">
          {active ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-3">
                <div>
                  <p className="text-sm font-bold text-ink-900">{active.subject}</p>
                  <p className="text-xs text-ink-500">
                    {state.suppliers.find((s) => s.id === active.supplierId)?.name}
                  </p>
                </div>
                <div className="flex gap-3 text-[13px]">
                  {active.orderId && (
                    <Link
                      to={`/orders/${active.orderId}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      Открыть заявку
                    </Link>
                  )}
                  {active.productId && (
                    <Link
                      to={`/product/${active.productId}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      Открыть товар
                    </Link>
                  )}
                  <Link
                    to={`/suppliers/${active.supplierId}`}
                    className="font-medium text-ink-500 hover:text-brand-600"
                  >
                    Профиль поставщика
                  </Link>
                </div>
              </div>
              <div className="min-h-0 flex-1 pt-3">
                <ChatPanel threadId={active.id} role="buyer" height="h-full" />
              </div>
            </>
          ) : (
            <EmptyState title="Выберите чат" compact className="border-0" />
          )}
        </div>
      </div>
    </div>
  );
}
