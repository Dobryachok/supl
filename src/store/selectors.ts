import { isoDate, startOfToday } from '@/lib/format';
import type {
  AppState,
  Order,
  OrderStatus,
  Product,
  Supplier,
  TempMode,
} from '@/types';

export interface CartLine {
  product: Product;
  qty: number;
  total: number;
  exceedsStock: boolean;
}

export interface CartGroup {
  supplier: Supplier;
  lines: CartLine[];
  goodsTotal: number;
  deliveryFee: number;
  total: number;
  nearestDelivery: string;
}

export function productsById(state: AppState): Map<string, Product> {
  return new Map(state.products.map((p) => [p.id, p]));
}

export function supplierMap(state: AppState): Map<string, Supplier> {
  return new Map(state.suppliers.map((s) => [s.id, s]));
}

export function activeProducts(state: AppState): Product[] {
  return state.products.filter((p) => p.isActive);
}

export function productsOfSupplier(state: AppState, supplierId: string): Product[] {
  return state.products.filter((p) => p.supplierId === supplierId);
}

/** Ближайшие даты доставки поставщика с учётом дней отгрузки и срока сборки. */
export function nextDeliveryDates(supplier: Supplier, count = 6): string[] {
  const dates: string[] = [];
  const cursor = startOfToday();
  cursor.setDate(cursor.getDate() + Math.max(1, supplier.leadTimeDays));
  for (let i = 0; i < 45 && dates.length < count; i += 1) {
    const day = cursor.getDay() === 0 ? 7 : cursor.getDay();
    if (supplier.deliveryDays.includes(day)) dates.push(isoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function cartGroups(state: AppState): CartGroup[] {
  const products = productsById(state);
  const suppliers = supplierMap(state);
  const bySupplier = new Map<string, CartLine[]>();

  for (const item of state.cart) {
    const product = products.get(item.productId);
    if (!product) continue;
    const line: CartLine = {
      product,
      qty: item.qty,
      total: product.price * item.qty,
      exceedsStock: item.qty > product.stock,
    };
    const list = bySupplier.get(product.supplierId) ?? [];
    list.push(line);
    bySupplier.set(product.supplierId, list);
  }

  return Array.from(bySupplier.entries())
    .map(([supplierId, lines]) => {
      const supplier = suppliers.get(supplierId)!;
      const goodsTotal = lines.reduce((sum, l) => sum + l.total, 0);
      const deliveryFee = goodsTotal >= supplier.freeDeliveryFrom ? 0 : supplier.deliveryFee;
      return {
        supplier,
        lines,
        goodsTotal,
        deliveryFee,
        total: goodsTotal + deliveryFee,
        nearestDelivery: nextDeliveryDates(supplier, 1)[0] ?? isoDate(startOfToday()),
      };
    })
    .sort((a, b) => a.supplier.name.localeCompare(b.supplier.name, 'ru'));
}

export function cartCount(state: AppState): number {
  return state.cart.length;
}

export function cartTotal(state: AppState): number {
  const products = productsById(state);
  return state.cart.reduce((sum, item) => {
    const product = products.get(item.productId);
    return product ? sum + product.price * item.qty : sum;
  }, 0);
}

export interface OrderTotals {
  goods: number;
  delivery: number;
  total: number;
  factGoods: number;
  factTotal: number;
  discrepancy: number;
  positions: number;
}

export function orderTotals(order: Order): OrderTotals {
  const goods = order.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const factGoods = order.lines.reduce((sum, l) => sum + l.price * (l.factQty ?? l.qty), 0);
  return {
    goods,
    delivery: order.deliveryFee,
    total: goods + order.deliveryFee,
    factGoods,
    factTotal: factGoods + order.deliveryFee,
    discrepancy: goods - factGoods,
    positions: order.lines.length,
  };
}

export const activeStatuses: OrderStatus[] = ['draft', 'sent', 'confirmed', 'shipped', 'delivered'];
export const trackedStatuses: OrderStatus[] = ['sent', 'confirmed', 'shipped', 'delivered'];
export const closedStatuses: OrderStatus[] = [
  'accepted',
  'partially_accepted',
  'refused',
  'rejected',
  'cancelled',
];

export interface OrdersKpi {
  inWorkAmount: number;
  inWorkCount: number;
  overdueCount: number;
  overdueAmount: number;
  todayCount: number;
  actsCount: number;
  actsAmount: number;
}

/** Активные поставки для трекинга — отсортированы по дате доставки. */
export function activeDeliveries(state: AppState, limit?: number): Order[] {
  const list = state.orders
    .filter((o) => trackedStatuses.includes(o.status))
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
  return limit ? list.slice(0, limit) : list;
}

export const deliveryClosedStatuses: OrderStatus[] = ['accepted', 'partially_accepted', 'refused'];

export type DeliveryCalendarStatusFilter =
  | 'all'
  | 'overdue'
  | 'acceptance'
  | 'closed'
  | 'in_transit';

export interface DeliveryCalendarFilters {
  status: DeliveryCalendarStatusFilter;
  supplierId: string;
  outletId: string;
  includeClosed: boolean;
}

export const emptyDeliveryCalendarFilters: DeliveryCalendarFilters = {
  status: 'all',
  supplierId: '',
  outletId: '',
  includeClosed: false,
};

export function calendarBaseOrders(state: AppState, includeClosed: boolean): Order[] {
  const allowed = new Set<OrderStatus>(trackedStatuses);
  if (includeClosed) {
    for (const status of deliveryClosedStatuses) allowed.add(status);
  }
  return state.orders.filter((o) => allowed.has(o.status));
}

export function filterDeliveries(state: AppState, filters: DeliveryCalendarFilters): Order[] {
  const includeClosed = filters.includeClosed || filters.status === 'closed';
  return calendarBaseOrders(state, includeClosed).filter((order) => {
    if (filters.supplierId && order.supplierId !== filters.supplierId) return false;
    if (filters.outletId && order.outletId !== filters.outletId) return false;

    switch (filters.status) {
      case 'overdue':
        return isOverdue(order);
      case 'acceptance':
        return order.status === 'delivered';
      case 'closed':
        return deliveryClosedStatuses.includes(order.status);
      case 'in_transit':
        return order.status === 'shipped';
      case 'all':
      default:
        return true;
    }
  });
}

export function deliveriesByDate(orders: Order[]): Map<string, Order[]> {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    const list = map.get(order.deliveryDate) ?? [];
    list.push(order);
    map.set(order.deliveryDate, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.deliveryWindow.localeCompare(b.deliveryWindow));
  }
  return map;
}

export function ordersKpi(state: AppState): OrdersKpi {
  const today = isoDate(startOfToday());
  let inWorkAmount = 0;
  let inWorkCount = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let todayCount = 0;

  for (const order of state.orders) {
    const totals = orderTotals(order);
    if (activeStatuses.includes(order.status)) {
      inWorkAmount += totals.total;
      inWorkCount += 1;
      if (order.deliveryDate < today && order.status !== 'draft') {
        overdueCount += 1;
        overdueAmount += totals.total;
      }
      if (order.deliveryDate === today) todayCount += 1;
    }
  }

  const actsAmount = state.acts.reduce((sum, a) => sum + a.discrepancyAmount, 0);

  return {
    inWorkAmount,
    inWorkCount,
    overdueCount,
    overdueAmount,
    todayCount,
    actsCount: state.acts.length,
    actsAmount,
  };
}

export function statusCounts(orders: Order[]): Record<OrderStatus, number> {
  const counts = {
    draft: 0,
    sent: 0,
    confirmed: 0,
    rejected: 0,
    shipped: 0,
    delivered: 0,
    accepted: 0,
    partially_accepted: 0,
    refused: 0,
    cancelled: 0,
  } satisfies Record<OrderStatus, number>;
  for (const order of orders) counts[order.status] += 1;
  return counts;
}

export function isOverdue(order: Order): boolean {
  return (
    order.deliveryDate < isoDate(startOfToday()) &&
    ['sent', 'confirmed', 'shipped'].includes(order.status)
  );
}

/** Предложения того же товара у других поставщиков — для сравнения цен. */
export function alternativeOffers(state: AppState, product: Product): Product[] {
  const key = normalizeName(product.name);
  return state.products.filter(
    (p) => p.id !== product.id && p.isActive && normalizeName(p.name) === key,
  );
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[«»"',.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CatalogFilters {
  query?: string;
  categoryId?: string;
  subcategoryIds?: string[];
  supplierIds?: string[];
  brands?: string[];
  countries?: string[];
  tempModes?: TempMode[];
  priceFrom?: number;
  priceTo?: number;
  inStockOnly?: boolean;
  discountOnly?: boolean;
  fastDeliveryOnly?: boolean;
  favoriteOnly?: boolean;
}

export type CatalogSort = 'popular' | 'price-asc' | 'price-desc' | 'new' | 'discount' | 'name';

export function filterProducts(
  state: AppState,
  filters: CatalogFilters,
  sort: CatalogSort = 'popular',
): Product[] {
  const suppliers = supplierMap(state);
  const query = filters.query?.trim().toLowerCase();
  const tokens = query ? query.split(/\s+/) : [];

  const result = activeProducts(state).filter((p) => {
    if (filters.categoryId && p.categoryId !== filters.categoryId) return false;
    if (filters.subcategoryIds?.length && !filters.subcategoryIds.includes(p.subcategoryId))
      return false;
    if (filters.supplierIds?.length && !filters.supplierIds.includes(p.supplierId)) return false;
    if (filters.brands?.length && !filters.brands.includes(p.brand)) return false;
    if (filters.countries?.length && !filters.countries.includes(p.country)) return false;
    if (filters.tempModes?.length && !filters.tempModes.includes(p.tempMode)) return false;
    if (filters.priceFrom !== undefined && p.price < filters.priceFrom) return false;
    if (filters.priceTo !== undefined && p.price > filters.priceTo) return false;
    if (filters.inStockOnly && p.stock <= 0) return false;
    if (filters.discountOnly && !p.oldPrice) return false;
    if (filters.favoriteOnly && !state.favoriteProducts.includes(p.id)) return false;
    if (filters.fastDeliveryOnly) {
      const supplier = suppliers.get(p.supplierId);
      if (!supplier || supplier.leadTimeDays > 1) return false;
    }
    if (tokens.length) {
      const haystack = `${p.name} ${p.brand} ${p.article} ${p.country} ${p.tags.join(' ')} ${
        suppliers.get(p.supplierId)?.name ?? ''
      }`.toLowerCase();
      if (!tokens.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  return sortProducts(result, sort);
}

export function sortProducts(list: Product[], sort: CatalogSort): Product[] {
  const sorted = [...list];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'new':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'discount':
      return sorted.sort((a, b) => discountPct(b) - discountPct(a));
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    case 'popular':
    default:
      return sorted.sort((a, b) => b.popularity - a.popularity);
  }
}

export function discountPct(product: Product): number {
  if (!product.oldPrice || product.oldPrice <= product.price) return 0;
  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}

export function supplierRatingSummary(state: AppState, supplierId: string) {
  const reviews = state.reviews.filter((r) => r.supplierId === supplierId);
  if (!reviews.length) return { rating: 0, count: 0 };
  const rating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { rating: +rating.toFixed(1), count: reviews.length };
}

export function unreadNotifications(state: AppState): number {
  return state.notifications.filter((n) => n.role === state.session.role && !n.read).length;
}

export function unreadThreads(state: AppState): number {
  const role = state.session.role;
  return state.threads.filter((t) =>
    role === 'buyer' ? t.unreadBuyer > 0 : t.unreadSeller > 0,
  ).length;
}

export function sellerOrders(state: AppState): Order[] {
  return state.orders.filter(
    (o) => o.supplierId === state.session.sellerSupplierId && o.status !== 'draft',
  );
}

export function frequentlyOrdered(state: AppState, limit = 8): Product[] {
  const counts = new Map<string, number>();
  for (const order of state.orders) {
    for (const line of order.lines) {
      counts.set(line.productId, (counts.get(line.productId) ?? 0) + 1);
    }
  }
  const products = productsById(state);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => products.get(id))
    .filter((p): p is Product => Boolean(p) && p!.isActive)
    .slice(0, limit);
}
