import type { ReactNode } from 'react';

/** Frame of the public auth screens (login, register): brand bar + title + content. */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="shell">
      <div className="apphead"><span className="brand">Usta Hafızası</span></div>
      <div className="content">
        <div className="pagetitle"><h1>{title}</h1></div>
        {children}
      </div>
    </main>
  );
}
