import { createInitialState } from '@/data/seed';
import type { AppState } from '@/types';

const KEY = 'supl.state.v1';
const VERSION = 1;

export function loadState(): AppState {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== VERSION || !parsed.products?.length) return createInitialState();
    return { ...createInitialState(), ...parsed };
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
