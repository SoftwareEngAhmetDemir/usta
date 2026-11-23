import { useContext } from 'react';
import { I18nContext, type Translate } from './context';

/** `t('Kaydet')`: the UI text in the user's site language (Turkish until its translation has arrived). */
export function useT(): Translate {
  return useContext(I18nContext);
}
