import { useEffect, useState } from 'react';
import { randomLatency } from '@/lib/mockApi';

/**
 * Имитирует задержку «запроса к серверу», чтобы скелетоны и состояния загрузки
 * вели себя так же, как с реальным API.
 */
export function useSimulatedLoad(deps: unknown[] = [], ms?: number): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const id = window.setTimeout(() => setLoading(false), ms ?? randomLatency(140, 340));
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return loading;
}
