import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Field';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { StatusBadge } from '@/components/orders/StatusBadge';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/format';
import { useAppState } from '@/store/AppContext';

export function SellerChatsPage() {
  const state = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');

  const own = state.threads.filter((t) => t.supplierId === state.session.sellerSupplierId);
  const threads = own
    .filter((thread) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      const order = state.orders.find((o) => o.id === thread.orderId);
      return `${thread.subject} ${order?.number ?? ''} ${state.restaurant.name}`
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const activeId = searchParams.get('thread') ?? threads[0]?.id;
  const active = own.find((t) => t.id === activeId);
  const activeOrder = state.orders.find((o) => o.id === active?.orderId);
  const activeProduct = state.products.find((p) => p.id === active?.productId);

  useEffect(() => {
    if (!searchParams.get('thread') && threads[0]) {
      setSearchParams({ thread: threads[0].id }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads.length]);

  if (own.length === 0) {
    return (
      <div>
        <h1 className="text-[26px]">Чаты с ресторанами</h1>
        <p className="mt-1 text-[13px] text-ink-500">
          Здесь появятся вопросы по товарам и переписка по заявкам
        </p>
        <EmptyState
          className="mt-4"
          icon={<MessageSquare className="size-6" />}
          title="Переписок пока нет"
          text="Ресторан напишет вам из карточки товара или из заявки — диалог откроется здесь."
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[26px]">Чаты с ресторанами</h1>
      <p className="mt-1 text-[13px] text-ink-500">
        Согласование замен, переносов и вопросы по заявкам
      </p>

      <div className="card mt-4 grid overflow-hidden lg:grid-cols-[300px_1fr]">
        <div className="border-b border-ink-100 lg:border-r lg:border-b-0">
          <div className="p-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по заявке или теме"
            />
          </div>
          <ul className="scroll-thin max-h-[520px] overflow-y-auto">
            {threads.map((thread) => {
              const order = state.orders.find((o) => o.id === thread.orderId);
              const last = thread.messages[thread.messages.length - 1];
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setSearchParams({ thread: thread.id })}
                    className={cn(
                      'w-full cursor-pointer border-b border-ink-100 p-3 text-left transition-colors',
                      thread.id === activeId ? 'bg-brand-50' : 'hover:bg-ink-50',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-semibold text-ink-900">
                        {state.restaurant.name}
                      </span>
                      {thread.unreadSeller > 0 && (
                        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
                          {thread.unreadSeller}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-500">
                      {thread.subject}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-400">
                      {last ? last.text : 'Нет сообщений'}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      {order && <StatusBadge status={order.status} size="sm" />}
                      <span className="text-[10px] text-ink-400">
                        {relativeTime(thread.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4">
          {active ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-3">
                <div>
                  <p className="text-sm font-bold text-ink-900">{active.subject}</p>
                  <p className="text-xs text-ink-500">
                    {state.restaurant.legalName} · ИНН {state.restaurant.inn}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[13px]">
                  {activeOrder && (
                    <>
                      <Badge tone="neutral">{activeOrder.number}</Badge>
                      <Link
                        to={`/seller/orders/${activeOrder.id}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        Открыть заявку
                      </Link>
                    </>
                  )}
                  {activeProduct && (
                    <Link
                      to={`/seller/products/${activeProduct.id}/edit`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {activeProduct.name}
                    </Link>
                  )}
                </div>
              </div>
              <div className="pt-3">
                <ChatPanel
                  threadId={active.id}
                  role="seller"
                  height="h-[420px]"
                  placeholder="Ответьте ресторану…"
                />
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
