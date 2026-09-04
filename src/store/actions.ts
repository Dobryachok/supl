import type {
  AcceptanceAct,
  AppNotification,
  ChatThread,
  Message,
  Order,
  OrderStatus,
  OrderTemplate,
  Product,
  ProductQuestion,
  RestaurantProfile,
  Review,
  Role,
  Supplier,
} from '@/types';

export type Action =
  | { type: 'state/reset' }
  | { type: 'session/setRole'; role: Role }
  | { type: 'session/setCity'; city: string }
  | { type: 'session/setSellerSupplier'; supplierId: string }
  | { type: 'cart/add'; productId: string; qty: number }
  | { type: 'cart/setQty'; productId: string; qty: number }
  | { type: 'cart/remove'; productId: string }
  | { type: 'cart/removeSupplier'; productIds: string[] }
  | { type: 'cart/addMany'; items: { productId: string; qty: number }[] }
  | { type: 'cart/clear' }
  | { type: 'orders/create'; orders: Order[] }
  | {
      type: 'orders/advance';
      orderId: string;
      status: OrderStatus;
      actor: Role | 'system';
      comment?: string;
    }
  | { type: 'orders/patch'; orderId: string; patch: Partial<Order> }
  | { type: 'orders/acceptance'; act: AcceptanceAct }
  | { type: 'threads/create'; thread: ChatThread }
  | { type: 'threads/message'; message: Message }
  | { type: 'threads/read'; threadId: string; role: Role }
  | { type: 'favorites/toggleProduct'; productId: string }
  | { type: 'favorites/toggleSupplier'; supplierId: string }
  | { type: 'templates/create'; template: OrderTemplate }
  | { type: 'templates/remove'; id: string }
  | { type: 'products/upsert'; product: Product }
  | { type: 'products/remove'; productIds: string[] }
  | { type: 'products/toggleActive'; productIds: string[]; isActive?: boolean }
  | { type: 'products/import'; products: Product[] }
  | { type: 'suppliers/update'; supplierId: string; patch: Partial<Supplier> }
  | { type: 'restaurant/update'; patch: Partial<RestaurantProfile> }
  | { type: 'questions/ask'; question: ProductQuestion }
  | { type: 'questions/answer'; id: string; answer: string }
  | { type: 'reviews/add'; review: Review }
  | { type: 'notifications/add'; notification: AppNotification }
  | { type: 'notifications/read'; id: string }
  | { type: 'notifications/readAll'; role: Role }
  | { type: 'search/remember'; query: string };
