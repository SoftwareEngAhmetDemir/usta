import { useContext } from 'react';
import type { Me } from '../../../api';
import { AuthContext, type AuthContextValue } from '../context';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** The logged-in user; only call below <RequireAuth>. */
export function useMe(): Me {
  const { auth } = useAuth();
  if (auth.status !== 'user') throw new Error('useMe must be used below <RequireAuth>');
  return auth.me;
}
