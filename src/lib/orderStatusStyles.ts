import type { OrderStatus } from '@/types';

export interface OrderStatusVisual {
  chip: string;
  badge: string;
  dot: string;
  label: string;
  iconActive: string;
  iconDone: string;
  short: string;
}

/** Единая палитра статусов заявок (календарь, бейджи, трекеры). */
export const orderStatusStyles: Record<OrderStatus, OrderStatusVisual> = {
  draft: {
    chip: 'bg-ink-100 text-ink-600',
    badge: 'bg-ink-100 text-ink-600 border-ink-200',
    dot: 'bg-ink-400',
    label: 'text-ink-600',
    iconActive: 'border-ink-500 bg-ink-500 text-white',
    iconDone: 'border-ink-400 bg-ink-50 text-ink-600',
    short: 'Черн.',
  },
  sent: {
    chip: 'bg-violet-100 text-violet-800',
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    dot: 'bg-violet-500',
    label: 'text-violet-800',
    iconActive: 'border-violet-500 bg-violet-500 text-white',
    iconDone: 'border-violet-500 bg-violet-50 text-violet-700',
    short: 'Отпр.',
  },
  confirmed: {
    chip: 'bg-indigo-100 text-indigo-800',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-600',
    label: 'text-indigo-800',
    iconActive: 'border-indigo-600 bg-indigo-600 text-white',
    iconDone: 'border-indigo-600 bg-indigo-50 text-indigo-700',
    short: 'Подтв.',
  },
  rejected: {
    chip: 'bg-danger-100 text-danger-700',
    badge: 'bg-danger-100 text-danger-700 border-danger-200',
    dot: 'bg-danger-500',
    label: 'text-danger-700',
    iconActive: 'border-danger-500 bg-danger-500 text-white',
    iconDone: 'border-danger-500 bg-danger-50 text-danger-600',
    short: 'Откл.',
  },
  shipped: {
    chip: 'bg-sky-100 text-sky-800',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
    label: 'text-sky-800',
    iconActive: 'border-sky-500 bg-sky-500 text-white',
    iconDone: 'border-sky-500 bg-sky-50 text-sky-700',
    short: 'В пути',
  },
  delivered: {
    chip: 'bg-lime-100 text-lime-900',
    badge: 'bg-lime-100 text-lime-900 border-lime-200',
    dot: 'bg-lime-500',
    label: 'text-lime-900',
    iconActive: 'border-lime-500 bg-lime-500 text-white',
    iconDone: 'border-lime-500 bg-lime-50 text-lime-800',
    short: 'Приёмка',
  },
  accepted: {
    chip: 'bg-emerald-100 text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    label: 'text-emerald-800',
    iconActive: 'border-emerald-600 bg-emerald-600 text-white',
    iconDone: 'border-emerald-600 bg-emerald-50 text-emerald-700',
    short: 'Принята',
  },
  partially_accepted: {
    chip: 'bg-yellow-100 text-yellow-900',
    badge: 'bg-yellow-100 text-yellow-900 border-yellow-200',
    dot: 'bg-yellow-500',
    label: 'text-yellow-900',
    iconActive: 'border-yellow-500 bg-yellow-500 text-white',
    iconDone: 'border-yellow-500 bg-yellow-50 text-yellow-800',
    short: 'Расх.',
  },
  refused: {
    chip: 'bg-orange-100 text-orange-800',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    dot: 'bg-orange-600',
    label: 'text-orange-800',
    iconActive: 'border-orange-600 bg-orange-600 text-white',
    iconDone: 'border-orange-600 bg-orange-50 text-orange-700',
    short: 'Отказ',
  },
  cancelled: {
    chip: 'bg-ink-100 text-ink-500',
    badge: 'bg-ink-100 text-ink-500 border-ink-200',
    dot: 'bg-ink-300',
    label: 'text-ink-500',
    iconActive: 'border-ink-400 bg-ink-400 text-white',
    iconDone: 'border-ink-300 bg-ink-50 text-ink-500',
    short: 'Отмена',
  },
};

export const calendarLegendStatuses: OrderStatus[] = [
  'sent',
  'confirmed',
  'shipped',
  'delivered',
  'accepted',
  'partially_accepted',
];

export const overdueOrderStyle = {
  chip: 'bg-danger-100 text-danger-800',
  dot: 'bg-danger-500',
  label: 'text-danger-700',
};
