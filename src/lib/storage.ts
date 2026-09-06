import { createInitialState } from '@/data/seed';
import type { AppState } from '@/types';

const KEY = 'supl.state.v1';
const VERSION = 1;

/** Подменяет устаревшие упоминания Москвы в сохранённом демо-состоянии. */
function localizeCity(text: string): string {
  return text
    .replaceAll('Московская область', 'Красноярский край')
    .replaceAll('Московская обл.', 'Красноярский край')
    .replaceAll('Москва', 'Красноярск');
}

function migrateState(state: AppState): AppState {
  return {
    ...state,
    session: { ...state.session, city: localizeCity(state.session.city) },
    restaurant: {
      ...state.restaurant,
      city: localizeCity(state.restaurant.city),
      outlets: state.restaurant.outlets.map((outlet) => ({
        ...outlet,
        city: localizeCity(outlet.city),
        address: localizeCity(outlet.address),
      })),
    },
    suppliers: state.suppliers.map((supplier) => ({
      ...supplier,
      city: localizeCity(supplier.city),
      address: localizeCity(supplier.address),
      deliveryZones: supplier.deliveryZones.map(localizeCity),
    })),
    orders: state.orders.map((order) => ({
      ...order,
      deliveryAddress: localizeCity(order.deliveryAddress),
    })),
    threads: state.threads.map((thread) => ({
      ...thread,
      messages: thread.messages.map((message) => ({
        ...message,
        text: localizeCity(message.text),
      })),
    })),
  };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== VERSION || !parsed.products?.length) return createInitialState();
    return migrateState({ ...createInitialState(), ...parsed });
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // квота localStorage переполнена — демо продолжает работать в памяти
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
