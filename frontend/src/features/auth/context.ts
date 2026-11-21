import { createContext } from 'react';
import type { LanguageCode, LoginIn, Me, RegisterIn } from '../../api';

// `loggedOut`: the user pressed "Çıkış yap", so the next login goes to its own role home, not the old page.
export type AuthState = { status: 'loading' } | { status: 'anon'; loggedOut?: boolean } | { status: 'user'; me: Me };

export interface AuthContextValue {
  auth: AuthState;
  signIn: (body: LoginIn) => Promise<Me>;
  signUp: (body: RegisterIn) => Promise<Me>;
  signOut: () => Promise<void>;
  setLanguage: (language: LanguageCode) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
