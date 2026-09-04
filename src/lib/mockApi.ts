/**
 * Слой имитации сети. Все обращения к «серверу» проходят через него,
 * поэтому замена демо-данных на реальный HTTP затрагивает только этот файл.
 */

export function delay(ms = 320): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function randomLatency(min = 180, max = 480): number {
  return Math.round(min + Math.random() * (max - min));
}

export async function request<T>(payload: T, ms = randomLatency()): Promise<T> {
  await delay(ms);
  return payload;
}
