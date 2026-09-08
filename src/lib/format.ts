import type {
  AcceptanceVerdict,
  DiscrepancyReason,
  OrderStatus,
  PaymentMethod,
  Unit,
} from '@/types';

const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const rubPrecise = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat('ru-RU');

export function money(value: number, precise = false): string {
  if (precise || (!Number.isInteger(value) && Math.abs(value) < 1000)) {
    return rubPrecise.format(value);
  }
  return rub.format(Math.round(value));
}

export function moneyShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${num.format(+(value / 1_000_000).toFixed(1))} млн ₽`;
  if (Math.abs(value) >= 10_000) return `${num.format(Math.round(value / 1000))} тыс ₽`;
  return money(value);
}

export function number(value: number): string {
  return num.format(value);
}

export function qty(value: number, unit: Unit): string {
  const formatted = Number.isInteger(value) ? num.format(value) : num.format(+value.toFixed(2));
  return `${formatted} ${unitLabel(unit)}`;
}

export function unitLabel(unit: Unit): string {
  switch (unit) {
    case 'kg':
      return 'кг';
    case 'pc':
      return 'шт';
    case 'l':
      return 'л';
    case 'pack':
      return 'упак.';
    case 'box':
      return 'кор.';
  }
}

const monthsShort = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

const monthsFull = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const weekdaysShort = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export function dateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${monthsShort[d.getMonth()]}`;
}

export function dateFull(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${monthsFull[d.getMonth()]} ${d.getFullYear()}`;
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${dateShort(iso)}, ${time}`;
}

export function weekday(iso: string): string {
  return weekdaysShort[new Date(iso).getDay()];
}

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** dd.mm.yyyy из ISO-даты. */
export function formatDateRu(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** Парсит dd.mm.yyyy или ISO; пустая строка — сброс, null — невалидно. */
export function parseDateRu(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const dt = new Date(trimmed);
    return isoDate(dt) === trimmed ? trimmed : null;
  }

  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (match[3].length === 2) year += 2000;

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dt = new Date(iso);
  return isoDate(dt) === iso ? iso : null;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysBetween(iso: string, from = startOfToday()): number {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - from.getTime()) / 86_400_000);
}

export function relativeDay(iso: string): string {
  const diff = daysBetween(iso);
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'завтра';
  if (diff === 2) return 'послезавтра';
  if (diff === -1) return 'вчера';
  if (diff < 0) return `${Math.abs(diff)} дн. назад`;
  return `через ${diff} дн.`;
}

export function relativeTime(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `${hours} ч назад`;
  return dateTime(iso);
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: 'Черновик',
  sent: 'Отправлена',
  confirmed: 'Подтверждена',
  rejected: 'Отклонена',
  shipped: 'В пути',
  delivered: 'Доставлена',
  accepted: 'Принята',
  partially_accepted: 'Расхождения',
  refused: 'Отказ от поставки',
  cancelled: 'Отменена',
};

export type StatusTone = 'neutral' | 'info' | 'progress' | 'success' | 'warn' | 'danger';

export const orderStatusTones: Record<OrderStatus, StatusTone> = {
  draft: 'neutral',
  sent: 'info',
  confirmed: 'info',
  rejected: 'danger',
  shipped: 'progress',
  delivered: 'progress',
  accepted: 'success',
  partially_accepted: 'warn',
  refused: 'danger',
  cancelled: 'neutral',
};

export const paymentLabels: Record<PaymentMethod, string> = {
  card: 'Картой онлайн',
  invoice: 'Счёт по безналу',
  credit: 'Отсрочка платежа',
};

export const discrepancyLabels: Record<DiscrepancyReason, string> = {
  shortage: 'Недовоз',
  defect: 'Брак / повреждение',
  expired: 'Истекающий срок',
  wrong_item: 'Пересорт / не тот товар',
  excess: 'Излишек',
};

export const verdictLabels: Record<AcceptanceVerdict, string> = {
  accepted: 'Принято полностью',
  partially_accepted: 'Принято с расхождениями',
  refused: 'Отказ от поставки',
};

export function plural(value: number, one: string, few: string, many: string): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function withCount(value: number, one: string, few: string, many: string): string {
  return `${num.format(value)} ${plural(value, one, few, many)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
