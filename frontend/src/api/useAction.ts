import { useCallback, useState } from 'react';

export interface ActionState<A extends unknown[], R> {
  run: (...args: A) => Promise<R | undefined>;
  pending: boolean;
  error: unknown;
  reset: () => void;
}

/** Wrap a mutation: tracks pending + error, never throws to the caller. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>): ActionState<A, R> {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const run = useCallback(
    async (...args: A) => {
      setPending(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (e: unknown) {
        setError(e);
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [fn],
  );
  const reset = useCallback(() => setError(null), []);
  return { run, pending, error, reset };
}
