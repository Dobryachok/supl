import { isoDate, startOfToday } from '@/lib/format';

export interface CalendarDay {
  iso: string;
  inMonth: boolean;
  isToday: boolean;
}

const monthsFull = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export const weekdayLabels = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function parseYearMonth(iso: string): { year: number; month: number } {
  const [year, month] = iso.split('-').map(Number);
  return { year, month: month - 1 };
}

export function yearMonthIso(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

export function startOfMonth(year: number, month: number): Date {
  const d = new Date(year, month, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthTitle(year: number, month: number): string {
  return `${monthsFull[month]} ${year}`;
}

/** 42 ячейки (6 недель), неделя начинается с понедельника. */
export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const today = isoDate(startOfToday());
  const first = startOfMonth(year, month);
  const startOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const iso = isoDate(d);
    days.push({
      iso,
      inMonth: d.getMonth() === month,
      isToday: iso === today,
    });
  }
  return days;
}

export function isIsoInRange(iso: string, from: string, to: string): boolean {
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}
