import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { useChatActions } from '@/hooks/useChatActions';
import { cn } from '@/lib/cn';
import { dateTime } from '@/lib/format';
import { useAppState } from '@/store/AppContext';
import type { Role } from '@/types';

export function ChatPanel({
  threadId,
  role,
  height = 'h-[340px]',
  placeholder = 'Напишите сообщение…',
}: {
  threadId?: string;
  role?: Role;
  height?: string;
  placeholder?: string;
}) {
  const state = useAppState();
  const chat = useChatActions();
  const actingRole = role ?? state.session.role;
  const thread = state.threads.find((t) => t.id === threadId);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thread) chat.markRead(thread.id, actingRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, thread?.messages.length, actingRole]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length]);

  if (!thread) {
    return (
      <EmptyState
        title="Диалог ещё не начат"
        text="Напишите поставщику — переписка сохранится в разделе «Чаты»."
        compact
      />
    );
  }

  const submit = () => {
    if (!text.trim()) return;
    chat.send(thread.id, text, actingRole);
    setText('');
  };

  return (
    <div className="flex flex-col">
      <div
        ref={scrollRef}
        className={cn('scroll-thin flex-1 space-y-2.5 overflow-y-auto pr-1', height)}
      >
        {thread.messages.length === 0 && (
          <p className="py-6 text-center text-[13px] text-ink-500">
            Сообщений пока нет — задайте вопрос по заявке.
          </p>
        )}
        {thread.messages.map((message) => {
          if (message.author === 'system') {
            return (
              <p
                key={message.id}
                className="mx-auto w-fit rounded-full bg-ink-100 px-3 py-1 text-center text-[12px] text-ink-500"
              >
                {message.text}
              </p>
            );
          }
          const mine = message.author === actingRole;
          return (
            <div key={message.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2',
                  mine ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-800',
                )}
              >
                <p
                  className={cn(
                    'text-[11px] font-semibold',
                    mine ? 'text-white/70' : 'text-ink-500',
                  )}
                >
                  {message.authorName}
                </p>
                <p className="mt-0.5 text-[13px] whitespace-pre-wrap">{message.text}</p>
                <p className={cn('mt-1 text-[10px]', mine ? 'text-white/60' : 'text-ink-400')}>
                  {dateTime(message.at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-end gap-2 border-t border-ink-100 pt-3">
        <Textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button icon={<Send className="size-4" />} onClick={submit} disabled={!text.trim()}>
          Отправить
        </Button>
      </div>
      <p className="mt-1 text-[11px] text-ink-400">Ctrl + Enter — отправить</p>
    </div>
  );
}
