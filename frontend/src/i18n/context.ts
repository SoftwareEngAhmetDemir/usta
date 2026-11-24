import { createContext } from 'react';

/** Turkish UI text → the same text in the user's site language. `quiet`: a text that turns up while the page is
 * in use (a live alert, an error message) is translated in the background without showing the page as loading. */
export type Translate = (text: string, options?: { quiet?: boolean }) => string;

// Outside the provider (login, register, unit tests) the UI is Turkish.
export const I18nContext = createContext<Translate>((text) => text);

// Is this text ready to show (translated, Turkish, or known to stay Turkish)? Lets the app chrome (header, menu)
// wait only for its own labels, not for whatever page is loading.
export const UiReadyContext = createContext<(text: string) => boolean>(() => true);

// true while the page's own (not quiet) UI texts are on their way from the backend: the page shows a skeleton
export const UiLoadingContext = createContext(false);

// Are page texts queued or on their way right now? Unlike UiLoadingContext it is current before React re-renders,
// for timers that must not act on a stale `false` (LanguageGate's reveal).
export const UiBusyNowContext = createContext<() => boolean>(() => false);
