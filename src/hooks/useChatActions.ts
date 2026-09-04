import { useToast } from '@/components/ui/Toast';
import { uid } from '@/lib/ids';
import { useAppState, useDispatch } from '@/store/AppContext';
import type { ChatThread, Role } from '@/types';

export function useChatActions() {
  const state = useAppState();
  const dispatch = useDispatch();
  const toast = useToast();

  const authorName = (role: Role) =>
    role === 'buyer'
      ? state.session.buyerName
      : (state.suppliers.find((s) => s.id === state.session.sellerSupplierId)?.contacts.manager ??
        'Поставщик');

  return {
    /** Находит существующую ветку или создаёт новую и возвращает её id. */
    ensureThread(params: {
      supplierId: string;
      orderId?: string;
      productId?: string;
      subject: string;
    }): string {
      const existing = state.threads.find(
        (t) =>
          t.supplierId === params.supplierId &&
          t.orderId === params.orderId &&
          t.productId === params.productId,
      );
      if (existing) return existing.id;

      const thread: ChatThread = {
        id: uid('th'),
        supplierId: params.supplierId,
        orderId: params.orderId,
        productId: params.productId,
        subject: params.subject,
        messages: [],
        unreadBuyer: 0,
        unreadSeller: 0,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'threads/create', thread });
      return thread.id;
    },

    send(threadId: string, text: string, role: Role = state.session.role) {
      const trimmed = text.trim();
      if (!trimmed) return;
      dispatch({
        type: 'threads/message',
        message: {
          id: uid('msg'),
          threadId,
          author: role,
          authorName: authorName(role),
          text: trimmed,
          at: new Date().toISOString(),
        },
      });
    },

    system(threadId: string, text: string) {
      dispatch({
        type: 'threads/message',
        message: {
          id: uid('msg'),
          threadId,
          author: 'system',
          authorName: 'SUPL',
          text,
          at: new Date().toISOString(),
        },
      });
    },

    markRead(threadId: string, role: Role = state.session.role) {
      dispatch({ type: 'threads/read', threadId, role });
    },

    notifySent() {
      toast.success('Сообщение отправлено', 'Поставщик увидит его в своём кабинете');
    },
  };
}
