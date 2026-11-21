import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LanguageCode, LoginIn, Me, RegisterIn } from '../../api';
import * as api from './api';
import { AuthContext, type AuthState } from './context';

/** Holds the session. The backend keeps it in an httpOnly cookie, so a reload stays logged in. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    api.fetchMe().then(
      (me) => setAuth({ status: 'user', me }),
      () => setAuth({ status: 'anon' }),
    );
  }, []);

  const signIn = useCallback(async (body: LoginIn) => {
    const me = await api.login(body);
    setAuth({ status: 'user', me });
    return me;
  }, []);

  const signUp = useCallback(async (body: RegisterIn) => {
    const me = await api.register(body);
    setAuth({ status: 'user', me });
    return me;
  }, []);

  const signOut = useCallback(async () => {
    await api.logout().catch(() => null); // leaving is always allowed, even offline
    setAuth({ status: 'anon', loggedOut: true });
  }, []);

  const setLanguage = useCallback(async (language: LanguageCode) => {
    const me: Me = await api.updateLanguage(language);
    setAuth({ status: 'user', me });
  }, []);

  const value = useMemo(
    () => ({ auth, signIn, signUp, signOut, setLanguage }),
    [auth, signIn, signUp, signOut, setLanguage],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
