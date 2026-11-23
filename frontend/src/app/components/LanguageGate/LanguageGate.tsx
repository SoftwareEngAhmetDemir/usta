import type { ReactNode } from 'react';
import { PageBusyContext } from '../../../api';
import { PageSkeleton } from '../PageSkeleton';
import { usePageReveal } from './usePageReveal';

interface Props {
  languageName: string;
  /** Off for Turkish: nothing to translate, pages show their own spinners. */
  enabled: boolean;
  children: ReactNode;
}

/** In a translated language, a skeleton stands in for each page until it and its data's texts are translated,
 * once per page. The page stays rendered but hidden: rendering is what tells the translator which texts it needs,
 * and it keeps its state and requests. */
export function LanguageGate({ languageName, enabled, children }: Props) {
  const { hidden, pageBusy } = usePageReveal();
  const hide = enabled && hidden;
  return (
    <PageBusyContext.Provider value={pageBusy}>
      {hide && <PageSkeleton languageName={languageName} />}
      <div className="flex flex-1 flex-col gap-4" hidden={hide}>{children}</div>
    </PageBusyContext.Provider>
  );
}
