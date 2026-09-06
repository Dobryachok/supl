/** Домен B2B-маркетплейса поставок для ресторанов. */

export type Role = 'buyer' | 'seller';

export type Unit = 'kg' | 'pc' | 'l' | 'pack' | 'box';

export type TempMode = 'frozen' | 'chilled' | 'dry';

export type PaymentMethod = 'card' | 'invoice' | 'credit';

export interface Subcategory {
  id: string;
  slug: string;
  name: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  icon: string;
  hue: number;
  subcategories: Subcategory[];
}

export interface SupplierContacts {
  phone: string;
  email: string;
  site: string;
  manager: string;
}

export interface Supplier {
  id: string;
  name: string;
  legalName: string;
  inn: string;
  kpp: string;
  city: string;
  address: string;
  verified: boolean;
  isManufacturer: boolean;
  rating: number;
  reviewsCount: number;
  ordersCount: number;
  since: number;
  description: string;
  hue: number;
  categoryIds: string[];
  deliveryFee: number;
  freeDeliveryFrom: number;
  /** Дни недели доставки: 1 — понедельник, 7 — воскресенье. */
  deliveryDays: number[];
  deliveryWindows: string[];
  deliveryZones: string[];
  leadTimeDays: number;
  paymentMethods: PaymentMethod[];
  contacts: SupplierContacts;
}

export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  supplierId: string;
  categoryId: string;
  subcategoryId: string;
  name: string;
  article: string;
  brand: string;
  country: string;
  unit: Unit;
  packSize: string;
  price: number;
  oldPrice?: number;
  /** Остаток на складе поставщика в единицах `unit`. */
  stock: number;
  minQty: number;
  step: number;
  tempMode: TempMode;
  tags: string[];
  description: string;
  specs: Spec[];
  /** Фото, загруженное поставщиком (data URL). Если пусто — рисуем плейсхолдер по категории. */
  photo?: string;
  isActive: boolean;
  createdAt: string;
  popularity: number;
  isNew: boolean;
}

export interface Review {
  id: string;
  supplierId: string;
  author: string;
  outlet: string;
  rating: number;
  text: string;
  at: string;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  author: string;
  text: string;
  at: string;
  answer?: string;
  answeredAt?: string;
}

export type OrderStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'rejected'
  | 'shipped'
  | 'delivered'
  | 'accepted'
  | 'partially_accepted'
  | 'refused'
  | 'cancelled';

export type DiscrepancyReason = 'shortage' | 'defect' | 'expired' | 'wrong_item' | 'excess';

export interface OrderLine {
  id: string;
  productId: string;
  name: string;
  article: string;
  unit: Unit;
  packSize: string;
  price: number;
  /** Заказанное количество. */
  qty: number;
  /** Принятое на складе количество, заполняется при приёмке. */
  factQty?: number;
  reason?: DiscrepancyReason;
  reasonComment?: string;
  photos?: string[];
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  at: string;
  actor: Role | 'system';
  comment?: string;
}

export interface Order {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  outletId: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  lines: OrderLine[];
  deliveryDate: string;
  deliveryWindow: string;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  comment?: string;
  deliveryFee: number;
  timeline: OrderEvent[];
  actId?: string;
  rejectReason?: string;
}

export interface AcceptanceLine {
  lineId: string;
  productName: string;
  article: string;
  unit: Unit;
  price: number;
  plannedQty: number;
  acceptedQty: number;
  reason?: DiscrepancyReason;
  comment?: string;
  photos: string[];
}

export type AcceptanceVerdict = 'accepted' | 'partially_accepted' | 'refused';

export interface AcceptanceAct {
  id: string;
  number: string;
  orderId: string;
  orderNumber: string;
  supplierId: string;
  createdAt: string;
  acceptedBy: string;
  lines: AcceptanceLine[];
  comment?: string;
  plannedAmount: number;
  acceptedAmount: number;
  discrepancyAmount: number;
  verdict: AcceptanceVerdict;
}

export interface Message {
  id: string;
  threadId: string;
  author: Role | 'system';
  authorName: string;
  text: string;
  at: string;
}

export interface ChatThread {
  id: string;
  supplierId: string;
  orderId?: string;
  productId?: string;
  subject: string;
  messages: Message[];
  unreadBuyer: number;
  unreadSeller: number;
  updatedAt: string;
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  city: string;
  contactName: string;
  phone: string;
  isDefault: boolean;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  email: string;
  scope: string;
}

export interface RestaurantProfile {
  name: string;
  legalName: string;
  inn: string;
  kpp: string;
  city: string;
  email: string;
  phone: string;
  outlets: Outlet[];
  employees: Employee[];
}

export interface CartItem {
  productId: string;
  qty: number;
  addedAt: string;
}

export interface OrderTemplate {
  id: string;
  name: string;
  createdAt: string;
  items: { productId: string; qty: number }[];
}

export type NotificationKind = 'order' | 'delivery' | 'chat' | 'act' | 'catalog';

export interface AppNotification {
  id: string;
  role: Role;
  kind: NotificationKind;
  title: string;
  text: string;
  link: string;
  at: string;
  read: boolean;
}

export interface Session {
  role: Role;
  city: string;
  buyerName: string;
  /** Компания, от лица которой работает роль «Продавец». */
  sellerSupplierId: string;
}

export interface AppState {
  version: number;
  session: Session;
  restaurant: RestaurantProfile;
  suppliers: Supplier[];
  products: Product[];
  reviews: Review[];
  questions: ProductQuestion[];
  cart: CartItem[];
  orders: Order[];
  acts: AcceptanceAct[];
  threads: ChatThread[];
  templates: OrderTemplate[];
  favoriteProducts: string[];
  favoriteSuppliers: string[];
  notifications: AppNotification[];
  recentSearches: string[];
}
