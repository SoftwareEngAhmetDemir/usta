import type { ReactNode } from 'react';
import { useUiLoading } from '../../../i18n';
import { PageSkeleton } from '../PageSkeleton';

/** While the page's texts are being translated, a skeleton stands in for it. The page itself stays rendered but
 * hidden: rendering is what tells the translator which texts it needs, and it keeps its state and requests. */
export function LanguageGate({ languageName, children }: { languageName: string; children: ReactNode }) {
  const loading = useUiLoading();
  return (
    <>
      {loading && <PageSkeleton languageName={languageName} />}
      <div className="flex flex-1 flex-col gap-4" hidden={loading}>{children}</div>
    </>
  );
}
