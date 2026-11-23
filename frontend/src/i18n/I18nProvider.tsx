import type { ReactNode } from 'react';
import { I18nContext, UiLoadingContext } from './context';
import { useUiTexts } from './useUiTexts';

/** The UI in `language`. Key it by language so a switch starts with that language's texts. */
export function I18nProvider({ language, children }: { language: string; children: ReactNode }) {
  const { t, loading } = useUiTexts(language);
  return (
    <I18nContext.Provider value={t}>
      <UiLoadingContext.Provider value={loading}>{children}</UiLoadingContext.Provider>
    </I18nContext.Provider>
  );
}
