import type { ReactNode } from 'react';
import { useMe } from '../../../features/auth';
import { I18nProvider } from '../../../i18n';

/** The signed-in user's site language for the whole UI; a new language starts fresh (keyed). */
export function UserLanguage({ children }: { children: ReactNode }) {
  const me = useMe();
  return <I18nProvider key={me.language} language={me.language}>{children}</I18nProvider>;
}
