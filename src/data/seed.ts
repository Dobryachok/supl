import { isoDate, startOfToday } from '@/lib/format';
import type {
  AcceptanceAct,
  AppNotification,
  AppState,
  ChatThread,
  Order,
  OrderEvent,
  OrderLine,
  OrderStatus,
  OrderTemplate,
  ProductQuestion,
  RestaurantProfile,
  Review,
} from '@/types';
import { productById, products } from './products';
import { supplierById, suppliers } from './suppliers';

const dayMs = 86_400_000;

function shiftDays(days: number, hour = 10): string {
  const d = startOfToday();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function shiftDate(days: number): string {
  const d = startOfToday();
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export const restaurantProfile: RestaurantProfile = {
  name: 'Ресторанная группа «Тёплый Стол»',
  legalName: 'ООО «Тёплый Стол»',
  inn: '7745012398',
  kpp: '774501001',
  city: 'Красноярск',
  email: 'zakup@teplystol.ru',
  phone: '+7 (391) 120-45-67',
  outlets: [
    {
      id: 'out-1',
      name: 'Кухня на Покровке',
      address: 'Красноярск, пр. Мира, 27, вход со двора',
      city: 'Красноярск',
      contactName: 'Шеф Артур Белов',
      phone: '+7 (916) 320-11-04',
      isDefault: true,
    },
    {
      id: 'out-2',
      name: 'Бургерная на Автозаводской',
      address: 'Красноярск, ул. 9 Мая, 18, склад 2',
      city: 'Красноярск',
      contactName: 'Мария Титова',
      phone: '+7 (925) 774-55-19',
      isDefault: false,
    },
    {
      id: 'out-3',
      name: 'Центральный склад',
      address: 'Красноярск, ул. Маерчака, 60, док 4',
      city: 'Красноярск',
      contactName: 'Кладовщик Пётр Гаев',
      phone: '+7 (903) 411-90-72',
      isDefault: false,
    },
  ],
  employees: [
    {
      id: 'emp-1',
      name: 'Артур Белов',
      position: 'Шеф-повар',
      email: 'chef@teplystol.ru',
      scope: 'Заявки и согласование меню',
    },
    {
      id: 'emp-2',
      name: 'Мария Титова',
      position: 'Менеджер по закупкам',
      email: 'zakup@teplystol.ru',
      scope: 'Все заявки, договоры, лимиты',
    },
    {
      id: 'emp-3',
      name: 'Пётр Гаев',
      position: 'Кладовщик',
      email: 'sklad@teplystol.ru',
      scope: 'Приёмка поставок, акты расхождений',
    },
  ],
};

interface OrderSeed {
  id: string;
  number: string;
  supplierId: string;
  outletId: string;
  status: OrderStatus;
  createdDays: number;
  deliveryDays: number;
  window?: string;
  items: [string, number][];
  comment?: string;
  rejectReason?: string;
  fact?: Record<string, number>;
}

const orderSeeds: OrderSeed[] = [
  {
    id: 'ord-1',
    number: 'SS-260828-1055C',
    supplierId: 'sup-bread-house',
    outletId: 'out-2',
    status: 'accepted',
    createdDays: -7,
    deliveryDays: -5,
    items: [
      ['p-041', 6],
      ['p-042', 2],
      ['p-046', 2],
    ],
  },
  {
    id: 'ord-2',
    number: 'SS-260830-2317K',
    supplierId: 'sup-hlado-master',
    outletId: 'out-3',
    status: 'partially_accepted',
    createdDays: -5,
    deliveryDays: -3,
    items: [
      ['p-034', 40],
      ['p-038', 10],
      ['p-036', 10],
    ],
    fact: { 'p-034': 30, 'p-038': 10, 'p-036': 8 },
    comment: 'Разгрузка через док 4, звонить кладовщику заранее.',
  },
  {
    id: 'ord-3',
    number: 'SS-260901-3488T',
    supplierId: 'sup-milk-standart',
    outletId: 'out-1',
    status: 'delivered',
    createdDays: -2,
    deliveryDays: 0,
    window: '04:00–08:00',
    items: [
      ['p-019', 4],
      ['p-020', 2],
      ['p-022', 6],
      ['p-021', 1],
    ],
  },
  {
    id: 'ord-4',
    number: 'SS-260902-4102M',
    supplierId: 'sup-meat-dvor',
    outletId: 'out-1',
    status: 'shipped',
    createdDays: -2,
    deliveryDays: 0,
    window: '06:00–10:00',
    items: [
      ['p-001', 6],
      ['p-003', 10],
      ['p-004', 8],
    ],
  },
  {
    id: 'ord-5',
    number: 'SS-260903-5290R',
    supplierId: 'sup-ocean-fish',
    outletId: 'out-1',
    status: 'confirmed',
    createdDays: -1,
    deliveryDays: 2,
    window: '05:00–09:00',
    items: [
      ['p-011', 8],
      ['p-014', 4],
      ['p-016', 2],
    ],
  },
  {
    id: 'ord-6',
    number: 'SS-260903-6011V',
    supplierId: 'sup-freshline',
    outletId: 'out-1',
    status: 'sent',
    createdDays: -1,
    deliveryDays: 1,
    window: '05:00–09:00',
    items: [
      ['p-029', 12],
      ['p-030', 50],
      ['p-031', 4],
      ['p-032', 20],
      ['p-033', 10],
    ],
  },
  {
    id: 'ord-7',
    number: 'SS-260829-7734B',
    supplierId: 'sup-bakaleya-yug',
    outletId: 'out-3',
    status: 'sent',
    createdDays: -6,
    deliveryDays: -1,
    window: '08:00–14:00',
    items: [
      ['p-048', 2],
      ['p-050', 2],
      ['p-051', 12],
    ],
    comment: 'Срочно нужно масло для фритюра, смена начинается в 10:00.',
  },
  {
    id: 'ord-8',
    number: 'SS-260902-8865N',
    supplierId: 'sup-syry-artel',
    outletId: 'out-1',
    status: 'rejected',
    createdDays: -2,
    deliveryDays: 1,
    items: [
      ['p-025', 12],
      ['p-028', 4],
    ],
    rejectReason: 'Буррата в этой варке распродана, ближайшая партия — через 4 дня.',
  },
  {
    id: 'ord-9',
    number: 'SS-260904-9120P',
    supplierId: 'sup-coffee-prime',
    outletId: 'out-2',
    status: 'draft',
    createdDays: 0,
    deliveryDays: 3,
    items: [
      ['p-064', 6],
      ['p-066', 2],
    ],
  },
  {
    id: 'ord-10',
    number: 'SS-260825-1043D',
    supplierId: 'sup-pakmaster',
    outletId: 'out-2',
    status: 'cancelled',
    createdDays: -10,
    deliveryDays: -8,
    items: [
      ['p-068', 900],
      ['p-070', 2000],
    ],
  },
];

const statusChains: Record<OrderStatus, OrderStatus[]> = {
  draft: ['draft'],
  sent: ['draft', 'sent'],
  confirmed: ['draft', 'sent', 'confirmed'],
  rejected: ['draft', 'sent', 'rejected'],
  shipped: ['draft', 'sent', 'confirmed', 'shipped'],
  delivered: ['draft', 'sent', 'confirmed', 'shipped', 'delivered'],
  accepted: ['draft', 'sent', 'confirmed', 'shipped', 'delivered', 'accepted'],
  partially_accepted: [
    'draft',
    'sent',
    'confirmed',
    'shipped',
    'delivered',
    'partially_accepted',
  ],
  refused: ['draft', 'sent', 'confirmed', 'shipped', 'delivered', 'refused'],
  cancelled: ['draft', 'sent', 'cancelled'],
};

const eventActors: Record<OrderStatus, Order['timeline'][number]['actor']> = {
  draft: 'buyer',
  sent: 'buyer',
  confirmed: 'seller',
  rejected: 'seller',
  shipped: 'seller',
  delivered: 'seller',
  accepted: 'buyer',
  partially_accepted: 'buyer',
  refused: 'buyer',
  cancelled: 'buyer',
};

function buildTimeline(seed: OrderSeed): OrderEvent[] {
  const chain = statusChains[seed.status];
  const span = Math.max(1, seed.deliveryDays - seed.createdDays);
  return chain.map((status, i) => {
    const progress = chain.length > 1 ? i / (chain.length - 1) : 0;
    const at = shiftDays(seed.createdDays + Math.round(progress * span), 8 + i);
    return {
      id: `${seed.id}-ev-${i}`,
      status,
      at,
      actor: eventActors[status],
      comment:
        status === 'rejected'
          ? seed.rejectReason
          : status === 'partially_accepted'
            ? 'Оформлен акт расхождений'
            : undefined,
    };
  });
}

function buildLines(seed: OrderSeed): OrderLine[] {
  return seed.items.map(([productId, qty], i) => {
    const product = productById.get(productId);
    if (!product) throw new Error(`Seed: неизвестный товар ${productId}`);
    const fact = seed.fact?.[productId];
    return {
      id: `${seed.id}-ln-${i}`,
      productId,
      name: product.name,
      article: product.article,
      unit: product.unit,
      packSize: product.packSize,
      price: product.price,
      qty,
      factQty: fact ?? (['accepted', 'partially_accepted'].includes(seed.status) ? qty : undefined),
      reason:
        fact !== undefined && fact < qty
          ? productId === 'p-036'
            ? 'defect'
            : 'shortage'
          : undefined,
      reasonComment:
        fact !== undefined && fact < qty
          ? productId === 'p-036'
            ? 'Две упаковки с повреждённой оболочкой, следы разморозки.'
            : 'Поставщик привёз 30 кг вместо 40 кг.'
          : undefined,
      photos: [],
    };
  });
}

export const seedOrders: Order[] = orderSeeds.map((seed) => {
  const supplier = supplierById.get(seed.supplierId)!;
  const outlet = restaurantProfile.outlets.find((o) => o.id === seed.outletId)!;
  const lines = buildLines(seed);
  const goods = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  return {
    id: seed.id,
    number: seed.number,
    supplierId: seed.supplierId,
    supplierName: supplier.name,
    outletId: seed.outletId,
    status: seed.status,
    createdAt: shiftDays(seed.createdDays, 9),
    updatedAt: shiftDays(Math.min(seed.deliveryDays, 0), 12),
    lines,
    deliveryDate: shiftDate(seed.deliveryDays),
    deliveryWindow: seed.window ?? supplier.deliveryWindows[0],
    deliveryAddress: outlet.address,
    paymentMethod: supplier.paymentMethods[0],
    comment: seed.comment,
    deliveryFee: goods >= supplier.freeDeliveryFrom ? 0 : supplier.deliveryFee,
    timeline: buildTimeline(seed),
    actId: seed.status === 'partially_accepted' ? 'act-1' : undefined,
    rejectReason: seed.rejectReason,
  };
});

const partialOrder = seedOrders.find((o) => o.id === 'ord-2')!;

export const seedActs: AcceptanceAct[] = [
  {
    id: 'act-1',
    number: 'АКТ-260901-014',
    orderId: partialOrder.id,
    orderNumber: partialOrder.number,
    supplierId: partialOrder.supplierId,
    createdAt: shiftDays(-3, 11),
    acceptedBy: 'Пётр Гаев',
    lines: partialOrder.lines.map((line) => ({
      lineId: line.id,
      productName: line.name,
      article: line.article,
      unit: line.unit,
      price: line.price,
      plannedQty: line.qty,
      acceptedQty: line.factQty ?? line.qty,
      reason: line.reason,
      comment: line.reasonComment,
      photos: [],
    })),
    comment: 'Недовоз картофеля фри и брак по овощной смеси. Поставщик согласовал перерасчёт.',
    plannedAmount: partialOrder.lines.reduce((s, l) => s + l.price * l.qty, 0),
    acceptedAmount: partialOrder.lines.reduce((s, l) => s + l.price * (l.factQty ?? l.qty), 0),
    discrepancyAmount: partialOrder.lines.reduce(
      (s, l) => s + l.price * (l.qty - (l.factQty ?? l.qty)),
      0,
    ),
    verdict: 'partially_accepted',
  },
];

export const seedThreads: ChatThread[] = [
  {
    id: 'th-1',
    supplierId: 'sup-hlado-master',
    orderId: 'ord-2',
    subject: 'Заявка SS-260830-2317K',
    unreadBuyer: 1,
    unreadSeller: 0,
    updatedAt: shiftDays(-3, 12),
    messages: [
      {
        id: 'th-1-m1',
        threadId: 'th-1',
        author: 'buyer',
        authorName: 'Пётр Гаев',
        text: 'Привезли 30 кг фри вместо 40 и две упаковки овощной смеси с разморозкой. Оформляем акт.',
        at: shiftDays(-3, 11),
      },
      {
        id: 'th-1-m2',
        threadId: 'th-1',
        author: 'seller',
        authorName: 'Дмитрий Хлебников',
        text: 'Принято, недостающие 10 кг довезём в следующую поставку, брак снимем с суммы счёта.',
        at: shiftDays(-3, 12),
      },
    ],
  },
  {
    id: 'th-2',
    supplierId: 'sup-meat-dvor',
    orderId: 'ord-4',
    subject: 'Заявка SS-260902-4102M',
    unreadBuyer: 0,
    unreadSeller: 0,
    updatedAt: shiftDays(-1, 15),
    messages: [
      {
        id: 'th-2-m1',
        threadId: 'th-2',
        author: 'buyer',
        authorName: 'Мария Титова',
        text: 'Можно рибай нарезать по 320 г порционно?',
        at: shiftDays(-1, 14),
      },
      {
        id: 'th-2-m2',
        threadId: 'th-2',
        author: 'seller',
        authorName: 'Игорь Северов',
        text: 'Да, нарежем по 320 г ± 10 г, доплата 40 ₽/кг за порционирование.',
        at: shiftDays(-1, 15),
      },
    ],
  },
  {
    id: 'th-3',
    supplierId: 'sup-syry-artel',
    productId: 'p-025',
    subject: 'Вопрос по товару: Буррата в рассоле 125 г',
    unreadBuyer: 0,
    unreadSeller: 1,
    updatedAt: shiftDays(0, 9),
    messages: [
      {
        id: 'th-3-m1',
        threadId: 'th-3',
        author: 'buyer',
        authorName: 'Артур Белов',
        text: 'Какой остаточный срок годности будет на момент доставки в Красноярск?',
        at: shiftDays(0, 9),
      },
    ],
  },
];

export const seedReviews: Review[] = [
  {
    id: 'rev-1',
    supplierId: 'sup-meat-dvor',
    author: 'Артур Белов',
    outlet: 'Кухня на Покровке',
    rating: 5,
    text: 'Стабильная мраморность, разделка по нашей спецификации. Ни одной пересортицы за полгода.',
    at: shiftDays(-14, 10),
  },
  {
    id: 'rev-2',
    supplierId: 'sup-meat-dvor',
    author: 'Ольга Шмидт',
    outlet: 'Steak Bar 22',
    rating: 4,
    text: 'Качество отличное, но окно доставки иногда смещается на час.',
    at: shiftDays(-40, 10),
  },
  {
    id: 'rev-3',
    supplierId: 'sup-milk-standart',
    author: 'Мария Титова',
    outlet: 'Тёплый Стол',
    rating: 5,
    text: 'Молоко приходит со сроком 12 суток, капучино стабильное. Заявки подтверждают за 15 минут.',
    at: shiftDays(-9, 10),
  },
  {
    id: 'rev-4',
    supplierId: 'sup-hlado-master',
    author: 'Пётр Гаев',
    outlet: 'Центральный склад',
    rating: 3,
    text: 'Дважды был недовоз по фри, но перерасчёт делают быстро и без споров.',
    at: shiftDays(-3, 13),
  },
  {
    id: 'rev-5',
    supplierId: 'sup-bread-house',
    author: 'Мария Титова',
    outlet: 'Бургерная на Автозаводской',
    rating: 5,
    text: 'Булочки к 6 утра как часы, ни одной сорванной поставки за год.',
    at: shiftDays(-6, 10),
  },
  {
    id: 'rev-6',
    supplierId: 'sup-freshline',
    author: 'Артур Белов',
    outlet: 'Кухня на Покровке',
    rating: 4,
    text: 'Зелень свежая, но иногда просят подтвердить замену сорта салата.',
    at: shiftDays(-20, 10),
  },
  {
    id: 'rev-7',
    supplierId: 'sup-coffee-prime',
    author: 'Илья Ковач',
    outlet: 'Coffee Lab',
    rating: 5,
    text: 'Обжарка под наш профиль, приезжают настраивать помол бесплатно.',
    at: shiftDays(-11, 10),
  },
  {
    id: 'rev-8',
    supplierId: 'sup-ocean-fish',
    author: 'Кенто Ямада',
    outlet: 'Sushi Room',
    rating: 4,
    text: 'Лосось трим D стабильный, тобико всегда в наличии. Минимальный заказ высокий.',
    at: shiftDays(-16, 10),
  },
];

export const seedQuestions: ProductQuestion[] = [
  {
    id: 'q-1',
    productId: 'p-001',
    author: 'Артур Белов',
    text: 'Можно заказать порционную нарезку по 320 г?',
    at: shiftDays(-4, 12),
    answer: 'Да, порционируем под заказ, доплата 40 ₽/кг. Указывайте в комментарии к заявке.',
    answeredAt: shiftDays(-4, 15),
  },
  {
    id: 'q-2',
    productId: 'p-034',
    author: 'Пётр Гаев',
    text: 'Какой остаточный срок годности на момент поставки?',
    at: shiftDays(-8, 11),
    answer: 'Не менее 10 месяцев от даты производства.',
    answeredAt: shiftDays(-8, 14),
  },
  {
    id: 'q-3',
    productId: 'p-041',
    author: 'Мария Титова',
    text: 'Есть ли вариант без кунжута?',
    at: shiftDays(-2, 10),
    answer: 'Да, артикул BRE-1287 — та же бриошь без кунжута, цена одинаковая.',
    answeredAt: shiftDays(-2, 11),
  },
  {
    id: 'q-4',
    productId: 'p-019',
    author: 'Илья Ковач',
    text: 'Бывает ли фасовка 12 × 0,9 л?',
    at: shiftDays(-1, 16),
  },
];

export const seedTemplates: OrderTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Недельная закупка — Покровка',
    createdAt: shiftDays(-21, 10),
    items: [
      { productId: 'p-019', qty: 4 },
      { productId: 'p-020', qty: 2 },
      { productId: 'p-029', qty: 12 },
      { productId: 'p-031', qty: 4 },
      { productId: 'p-007', qty: 10 },
    ],
  },
  {
    id: 'tpl-2',
    name: 'Бургерная: старт смены',
    createdAt: shiftDays(-12, 10),
    items: [
      { productId: 'p-041', qty: 6 },
      { productId: 'p-003', qty: 10 },
      { productId: 'p-034', qty: 40 },
      { productId: 'p-068', qty: 900 },
    ],
  },
];

export const seedNotifications: AppNotification[] = [
  {
    id: 'ntf-1',
    role: 'buyer',
    kind: 'delivery',
    title: 'Поставка сегодня',
    text: 'Мясной Двор — заявка SS-260902-4102M в пути, окно 06:00–10:00.',
    link: '/orders/ord-4',
    at: shiftDays(0, 7),
    read: false,
  },
  {
    id: 'ntf-2',
    role: 'buyer',
    kind: 'act',
    title: 'Ожидает приёмки',
    text: 'Заявка SS-260901-3488T доставлена — примите товар на складе.',
    link: '/orders/ord-3/acceptance',
    at: shiftDays(0, 8),
    read: false,
  },
  {
    id: 'ntf-3',
    role: 'buyer',
    kind: 'order',
    title: 'Заявка отклонена',
    text: 'Сыры Артель отклонили SS-260902-8865N: буррата распродана.',
    link: '/orders/ord-8',
    at: shiftDays(-1, 17),
    read: true,
  },
  {
    id: 'ntf-4',
    role: 'seller',
    kind: 'order',
    title: 'Новая заявка',
    text: 'Тёплый Стол прислал заявку на 5 позиций.',
    link: '/seller/orders',
    at: shiftDays(-1, 18),
    read: false,
  },
];

export function createInitialState(): AppState {
  return {
    version: 1,
    session: {
      role: 'buyer',
      city: 'Красноярск',
      buyerName: 'Мария Титова',
      sellerSupplierId: 'sup-meat-dvor',
    },
    restaurant: restaurantProfile,
    suppliers: suppliers.map((s) => ({ ...s })),
    products: products.map((p) => ({ ...p })),
    reviews: seedReviews,
    questions: seedQuestions,
    cart: [
      { productId: 'p-007', qty: 10, addedAt: shiftDays(0, 9) },
      { productId: 'p-041', qty: 96, addedAt: shiftDays(0, 9) },
      { productId: 'p-034', qty: 20, addedAt: shiftDays(0, 9) },
    ],
    orders: seedOrders,
    acts: seedActs,
    threads: seedThreads,
    templates: seedTemplates,
    favoriteProducts: ['p-001', 'p-019', 'p-034'],
    favoriteSuppliers: ['sup-meat-dvor', 'sup-bread-house'],
    notifications: seedNotifications,
    recentSearches: ['картофель фри', 'моцарелла', 'булочка бриошь'],
  };
}

export const seedMeta = { dayMs };
