import { createContext } from 'react';

/** Turkish UI text → the same text in the user's site language. */
export type Translate = (text: string) => string;

// Outside the provider (login, register, unit tests) the UI is Turkish.
export const I18nContext = createContext<Translate>((text) => text);

// true while UI texts are on their way from the backend (the page shows some in Turkish meanwhile)
export const UiLoadingContext = createContext(false);
