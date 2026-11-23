import type { ReactNode } from 'react';
import { useT } from '../../../../i18n';

/** Frame of the public auth screens (login, register): brand bar + title + content. */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  const t = useT();
  return (
    <main className="shell">
      <div className="apphead"><span className="brand">{t('Usta Hafızası')}</span></div>
      <div className="content">
        <div className="pagetitle"><h1>{title}</h1></div>
        {children}
      </div>
    </main>
  );
}
