import { useCallback, useEffect, useState } from 'react';
import { request } from './client';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'ok'; data: T }
  | { status: 'error'; error: unknown };

export interface ApiResult<T> {
  state: ApiState<T>;
  reload: () => void;
}

type Stored<T> = { path: string | null; state: ApiState<T> };

/** Interval in ms, or a function of the loaded data (return undefined to stop polling). */
export type Poll<T> = number | ((data: T) => number | undefined);

/** GET `path` (null = skip) and track loading/error/data. `poll` refetches in the background. */
export function useApi<T>(path: string | null, poll?: Poll<T>): ApiResult<T> {
  const [stored, setStored] = useState<Stored<T>>({ path, state: { status: 'loading' } });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (path === null) return;
    const ctrl = new AbortController();
    request<T>(path, { signal: ctrl.signal })
      .then((data) => setStored({ path, state: { status: 'ok', data } }))
      .catch((error: unknown) => {
        if (ctrl.signal.aborted) return;
        // A failed background refresh keeps the data already on screen.
        setStored((prev) =>
          prev.path === path && prev.state.status === 'ok' ? prev : { path, state: { status: 'error', error } },
        );
      });
    return () => ctrl.abort();
  }, [path, tick]);

  const state: ApiState<T> = stored.path === path ? stored.state : { status: 'loading' };
  const pollMs = typeof poll === 'function' ? (state.status === 'ok' ? poll(state.data) : undefined) : poll;

  useEffect(() => {
    if (!pollMs || path === null) return;
    const id = setInterval(reload, pollMs);
    return () => clearInterval(id);
  }, [pollMs, path, reload]);

  return { state, reload };
}
