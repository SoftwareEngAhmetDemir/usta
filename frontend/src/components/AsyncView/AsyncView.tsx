import type { ReactNode } from 'react';
import type { ApiState } from '../../api';
import { ErrorMessage } from '../ErrorMessage';
import { Spinner } from '../Spinner';

/** Spinner while loading, a retryable error, or `children(data)`. */
export function AsyncView<T>({ state, onRetry, children }: { state: ApiState<T>; onRetry?: () => void; children: (data: T) => ReactNode }) {
  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error') return <ErrorMessage error={state.error} onRetry={onRetry} />;
  return <>{children(state.data)}</>;
}
