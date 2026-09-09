import { useToast } from '@/components/ui/Toast';
import { dateFull, orderStatusLabels } from '@/lib/format';
import { useDispatch } from '@/store/AppContext';
import type { Order, OrderStatus, Role } from '@/types';
import { useChatActions } from './useChatActions';

/**
 * Переходы по этапам поставки. Любое изменение статуса пишется в таймлайн заявки
 * и системным сообщением в чат, поэтому вторая сторона сразу видит движение.
 */
export function useOrderFlow() {
  const dispatch = useDispatch();
  const chat = useChatActions();
  const toast = useToast();

  const advance = (order: Order, status: OrderStatus, comment: string, actor: Role = 'seller') => {
    dispatch({ type: 'orders/advance', orderId: order.id, status, actor, comment });
    const threadId = chat.ensureThread({
      supplierId: order.supplierId,
      orderId: order.id,
      subject: `Заявка ${order.number}`,
    });
    chat.system(threadId, comment);
    toast.success(`${order.number}: ${orderStatusLabels[status].toLowerCase()}`, comment);
  };

  return {
    advance,

    confirm(order: Order) {
      advance(order, 'confirmed', `Заявка подтверждена, доставка ${dateFull(order.deliveryDate)}`);
    },

    ship(order: Order) {
      advance(order, 'shipped', `Машина вышла в рейс, окно ${order.deliveryWindow}`);
    },

    deliver(order: Order, actor: Role = 'seller') {
      const comment =
        actor === 'buyer'
          ? 'Ресторан отметил поставку как доставленную, ожидаем приёмку'
          : 'Доставлено на склад ресторана, ожидаем приёмку';
      advance(order, 'delivered', comment, actor);
    },

    reject(order: Order, reason: string) {
      advance(order, 'rejected', reason.trim() || 'Заявка отклонена поставщиком');
    },

    cancel(order: Order, reason: string) {
      advance(order, 'cancelled', reason.trim() || 'Заявка отменена рестораном', 'buyer');
    },

    reschedule(order: Order, date: string, window: string) {
      dispatch({
        type: 'orders/patch',
        orderId: order.id,
        patch: { deliveryDate: date, deliveryWindow: window },
      });
      const threadId = chat.ensureThread({
        supplierId: order.supplierId,
        orderId: order.id,
        subject: `Заявка ${order.number}`,
      });
      chat.system(threadId, `Доставка перенесена на ${dateFull(date)}, окно ${window}.`);
      toast.success('Дата доставки обновлена', `${dateFull(date)}, ${window}`);
    },
  };
}
