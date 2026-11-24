import { useContext } from 'react';
import { UiBusyNowContext, UiLoadingContext } from './context';

/** True while the page's UI texts are being translated into the user's language. */
export function useUiLoading(): boolean {
  return useContext(UiLoadingContext);
}

/** Asks, at the moment it is called, whether page texts are still queued or on their way (for timers). */
export function useUiBusyNow(): () => boolean {
  return useContext(UiBusyNowContext);
}
