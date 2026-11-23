import { useContext } from 'react';
import { UiLoadingContext } from './context';

/** True while the page's UI texts are being translated into the user's language. */
export function useUiLoading(): boolean {
  return useContext(UiLoadingContext);
}
