import { useCallback, useEffect, useState } from 'react';
import { ApiProblem } from '../api/http';

export type Load<T> = { data: T | null; error: ApiProblem | Error | null; loading: boolean; reload(): void; set(d: T): void };

export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): Load<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiProblem | Error | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  const reload = useCallback(() => {
    setLoading(true);
    run().then((d) => { setData(d); setError(null); }).catch((e) => setError(e)).finally(() => setLoading(false));
  }, [run]);
  useEffect(reload, [reload]);
  return { data, error, loading, reload, set: setData };
}

export const statusOf = (e: unknown) => (e instanceof ApiProblem ? e.status : 0);
