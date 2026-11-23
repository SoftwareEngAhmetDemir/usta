import type { ReactNode } from 'react';
import { I18nContext, UiLoadingContext, UiReadyContext } from './context';
import { useUiTexts } from './useUiTexts';

/** The UI in `language`. Key it by language so a switch starts with that language's texts. */
export function I18nProvider({ language, children }: { language: string; children: ReactNode }) {
  const { t, loading, ready } = useUiTexts(language);
  return (
    <I18nContext.Provider value={t}>
      <UiReadyContext.Provider value={ready}>
        <UiLoadingContext.Provider value={loading}>{children}</UiLoadingContext.Provider>
      </UiReadyContext.Provider>
    </I18nContext.Provider>
  );
}
