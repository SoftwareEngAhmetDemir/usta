import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '../../components/Spinner';
import { useAuth } from './hooks/useAuth';

/** Sends anonymous users to /login and remembers where they were going (e.g. the scanned machine). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { auth } = useAuth();
  const location = useLocation();
  if (auth.status === 'loading') return <Spinner />;
  if (auth.status === 'anon') {
    if (auth.loggedOut) return <Navigate to="/login" replace />;
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
