import { useState } from 'react';
import type { Language, LanguageCode } from '../../../api';
import { useApi } from '../../../api';
import { useAuth, useMe } from '../../auth';

/** Content languages from the backend + the user's saved choice (KAN-46). `onChanged` refetches content. */
export function useLanguageSwitch(onChanged: () => void) {
  const me = useMe();
  const { setLanguage } = useAuth();
  const { state } = useApi<Language[]>('/languages');
  const [error, setError] = useState<unknown>(null);

  async function choose(code: LanguageCode) {
    if (code === me.language) return;
    setError(null);
    try {
      await setLanguage(code);
      onChanged();
    } catch (e: unknown) {
      setError(e);
    }
  }

  return { languages: state.status === 'ok' ? state.data : [], current: me.language, choose, error };
}
