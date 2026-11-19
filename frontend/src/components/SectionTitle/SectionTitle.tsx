import type { ReactNode } from 'react';

export function SectionTitle({ title, extra, id }: { title: string; extra?: ReactNode; id?: string }) {
  return (
    <h2 className="sec-title" id={id}>
      {title}
      {extra !== undefined && <small>{extra}</small>}
    </h2>
  );
}
