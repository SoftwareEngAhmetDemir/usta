import { createContext, useContext, useEffect } from 'react';

/** Lets a page say "my data is still loading" to whoever waits for it (the language gate keeps its skeleton up
 * until the page and the texts that come with its data are ready). `add` returns the matching "done". */
export const PageBusyContext = createContext<{ add: () => () => void }>({ add: () => () => undefined });

export function usePageBusy(busy: boolean) {
  const { add } = useContext(PageBusyContext);
  useEffect(() => (busy ? add() : undefined), [busy, add]);
}
