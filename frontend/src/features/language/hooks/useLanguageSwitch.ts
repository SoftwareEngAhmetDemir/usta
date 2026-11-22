import { useState } from 'react';
import type { Language, LanguageCode } from '../../../api';
import { useApi } from '../../../api';
import { useAuth, useMe } from '../../auth';

/** Languages from the backend + the user's saved choice (KAN-46). Saving it updates the session's user, which
 * re-opens the current page in the new language (AppLayout keys the page by language). */
export function useLanguageSwitch() {
  const me = useMe();
  const { setLanguage } = useAuth();
  const { state } = useApi<Language[]>('/languages');
  const [error, setError] = useState<unknown>(null);

  async function choose(code: LanguageCode) {
    if (code === me.language) return;
    setError(null);
    try {
      await setLanguage(code);
    } catch (e: unknown) {
      setError(e);
    }
  }

  return { languages: state.status === 'ok' ? state.data : [], current: me.language, choose, error };
}
