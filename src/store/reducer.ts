import { createInitialState } from '@/data/seed';
import { orderStatusLabels } from '@/lib/format';
import { uid } from '@/lib/ids';
import type { AppNotification, AppState, Order, OrderStatus, Role } from '@/types';
import type { Action } from './actions';

function touch(order: Order): Order {
  return { ...order, updatedAt: new Date().toISOString() };
}

function notificationFor(
  order: Order,
  status: OrderStatus,
  actor?: Role,
): AppNotification | null {
  const audience: Partial<Record<OrderStatus, Role>> = {
    sent: 'seller',
    confirmed: 'buyer',
    rejected: 'buyer',
    shipped: 'buyer',
    delivered: 'buyer',
    accepted: 'seller',
    partially_accepted: 'seller',
    refused: 'seller',
    cancelled: 'seller',
  };
  let role = audience[status];
  if (status === 'delivered' && actor === 'buyer') role = 'seller';
  if (!role) return null;

  const texts: Partial<Record<OrderStatus, string>> = {
    sent: `Новая заявка ${order.number} от ресторана.`,
    confirmed: `${order.supplierName} подтвердил заявку ${order.number}.`,
    rejected: `${order.supplierName} отклонил заявку ${order.number}.`,
    shipped: `Заявка ${order.number} передана в доставку.`,
    delivered:
      actor === 'buyer'
        ? `Ресторан отметил поставку ${order.number} как доставленную.`
        : `Заявка ${order.number} доставлена — требуется приёмка на складе.`,
    accepted: `Ресторан принял поставку ${order.number} полностью.`,
    partially_accepted: `По поставке ${order.number} оформлен акт расхождений.`,
    refused: `Ресторан отказался от поставки ${order.number}.`,
    cancelled: `Ресторан отменил заявку ${order.number}.`,
  };

  return {
    id: uid('ntf'),
    role,
    kind: status === 'partially_accepted' || status === 'refused' ? 'act' : 'order',
    title: orderStatusLabels[status],
    text: texts[status] ?? '',
    link: role === 'buyer' ? `/orders/${order.id}` : `/seller/orders/${order.id}`,
    at: new Date().toISOString(),
    read: false,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'state/reset':
      return createInitialState();

    case 'session/setRole':
      return { ...state, session: { ...state.session, role: action.role } };

    case 'session/setCity':
      return { ...state, session: { ...state.session, city: action.city } };

    case 'session/setSellerSupplier':
      return { ...state, session: { ...state.session, sellerSupplierId: action.supplierId } };

    case 'cart/add': {
      const existing = state.cart.find((i) => i.productId === action.productId);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((i) =>
            i.productId === action.productId ? { ...i, qty: i.qty + action.qty } : i,
          ),
        };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          { productId: action.productId, qty: action.qty, addedAt: new Date().toISOString() },
        ],
      };
    }

    case 'cart/addMany': {
      let cart = [...state.cart];
      for (const item of action.items) {
        const idx = cart.findIndex((i) => i.productId === item.productId);
        if (idx >= 0) {
          cart[idx] = { ...cart[idx], qty: cart[idx].qty + item.qty };
        } else {
          cart = [
            ...cart,
            { productId: item.productId, qty: item.qty, addedAt: new Date().toISOString() },
          ];
        }
      }
      return { ...state, cart };
    }

    case 'cart/setQty':
      return {
        ...state,
        cart:
          action.qty <= 0
            ? state.cart.filter((i) => i.productId !== action.productId)
            : state.cart.map((i) =>
                i.productId === action.productId ? { ...i, qty: action.qty } : i,
              ),
      };

    case 'cart/remove':
      return { ...state, cart: state.cart.filter((i) => i.productId !== action.productId) };

    case 'cart/removeSupplier':
      return {
        ...state,
        cart: state.cart.filter((i) => !action.productIds.includes(i.productId)),
      };

    case 'cart/clear':
      return { ...state, cart: [] };

    case 'orders/create': {
      const notifications = action.orders
        .filter((o) => o.status === 'sent')
        .map((o) => notificationFor(o, 'sent'))
        .filter((n): n is AppNotification => Boolean(n));
      return {
        ...state,
        orders: [...action.orders, ...state.orders],
        notifications: [...notifications, ...state.notifications],
      };
    }

    case 'orders/advance': {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      const updated = touch({
        ...order,
        status: action.status,
        rejectReason: action.status === 'rejected' ? action.comment : order.rejectReason,
        timeline: [
          ...order.timeline,
          {
            id: uid('ev'),
            status: action.status,
            at: new Date().toISOString(),
            actor: action.actor,
            comment: action.comment,
          },
        ],
      });
      const notification = notificationFor(updated, action.status, action.actor);
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === updated.id ? updated : o)),
        notifications: notification
          ? [notification, ...state.notifications]
          : state.notifications,
      };
    }

    case 'orders/patch':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? touch({ ...o, ...action.patch }) : o,
        ),
      };

    case 'orders/acceptance': {
      const act = action.act;
      const order = state.orders.find((o) => o.id === act.orderId);
      if (!order) return state;
      const factByLine = new Map(act.lines.map((l) => [l.lineId, l]));
      const updated = touch({
        ...order,
        status: act.verdict,
        actId: act.id,
        lines: order.lines.map((line) => {
          const factLine = factByLine.get(line.id);
          return factLine
            ? {
                ...line,
                factQty: factLine.acceptedQty,
                reason: factLine.reason,
                reasonComment: factLine.comment,
                photos: factLine.photos,
              }
            : line;
        }),
        timeline: [
          ...order.timeline,
          {
            id: uid('ev'),
            status: act.verdict,
            at: new Date().toISOString(),
            actor: 'buyer' as const,
            comment:
              act.verdict === 'accepted'
                ? 'Поставка принята полностью'
                : `Оформлен акт ${act.number}`,
          },
        ],
      });
      const notification = notificationFor(updated, act.verdict);
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === updated.id ? updated : o)),
        acts: [act, ...state.acts],
        notifications: notification
          ? [notification, ...state.notifications]
          : state.notifications,
      };
    }

    case 'threads/create':
      return { ...state, threads: [action.thread, ...state.threads] };

    case 'threads/message': {
      const { message } = action;
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === message.threadId
            ? {
                ...t,
                messages: [...t.messages, message],
                updatedAt: message.at,
                unreadBuyer: message.author === 'seller' ? t.unreadBuyer + 1 : t.unreadBuyer,
                unreadSeller: message.author === 'buyer' ? t.unreadSeller + 1 : t.unreadSeller,
              }
            : t,
        ),
      };
    }

    case 'threads/read':
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId
            ? {
                ...t,
                unreadBuyer: action.role === 'buyer' ? 0 : t.unreadBuyer,
                unreadSeller: action.role === 'seller' ? 0 : t.unreadSeller,
              }
            : t,
        ),
      };

    case 'favorites/toggleProduct':
      return {
        ...state,
        favoriteProducts: state.favoriteProducts.includes(action.productId)
          ? state.favoriteProducts.filter((id) => id !== action.productId)
          : [...state.favoriteProducts, action.productId],
      };

    case 'favorites/toggleSupplier':
      return {
        ...state,
        favoriteSuppliers: state.favoriteSuppliers.includes(action.supplierId)
          ? state.favoriteSuppliers.filter((id) => id !== action.supplierId)
          : [...state.favoriteSuppliers, action.supplierId],
      };

    case 'templates/create':
      return { ...state, templates: [action.template, ...state.templates] };

    case 'templates/remove':
      return { ...state, templates: state.templates.filter((t) => t.id !== action.id) };

    case 'products/upsert': {
      const exists = state.products.some((p) => p.id === action.product.id);
      return {
        ...state,
        products: exists
          ? state.products.map((p) => (p.id === action.product.id ? action.product : p))
          : [action.product, ...state.products],
      };
    }

    case 'products/remove':
      return {
        ...state,
        products: state.products.filter((p) => !action.productIds.includes(p.id)),
        cart: state.cart.filter((i) => !action.productIds.includes(i.productId)),
      };

    case 'products/toggleActive':
      return {
        ...state,
        products: state.products.map((p) =>
          action.productIds.includes(p.id)
            ? { ...p, isActive: action.isActive ?? !p.isActive }
            : p,
        ),
      };

    case 'products/import': {
      const byArticle = new Map(action.products.map((p) => [`${p.supplierId}:${p.article}`, p]));
      const merged = state.products.map((p) => {
        const incoming = byArticle.get(`${p.supplierId}:${p.article}`);
        if (!incoming) return p;
        byArticle.delete(`${p.supplierId}:${p.article}`);
        return { ...p, ...incoming, id: p.id };
      });
      return { ...state, products: [...Array.from(byArticle.values()), ...merged] };
    }

    case 'suppliers/update':
      return {
        ...state,
        suppliers: state.suppliers.map((s) =>
          s.id === action.supplierId ? { ...s, ...action.patch } : s,
        ),
      };

    case 'restaurant/update':
      return { ...state, restaurant: { ...state.restaurant, ...action.patch } };

    case 'questions/ask':
      return { ...state, questions: [action.question, ...state.questions] };

    case 'questions/answer':
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.id
            ? { ...q, answer: action.answer, answeredAt: new Date().toISOString() }
            : q,
        ),
      };

    case 'reviews/add':
      return { ...state, reviews: [action.review, ...state.reviews] };

    case 'notifications/add':
      return { ...state, notifications: [action.notification, ...state.notifications] };

    case 'notifications/read':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n,
        ),
      };

    case 'notifications/readAll':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.role === action.role ? { ...n, read: true } : n,
        ),
      };

    case 'search/remember': {
      const query = action.query.trim();
      if (!query) return state;
      return {
        ...state,
        recentSearches: [query, ...state.recentSearches.filter((q) => q !== query)].slice(0, 8),
      };
    }

    default:
      return state;
  }
}
