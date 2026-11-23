import type { ReactNode } from 'react';

export function SectionTitle({ title, extra, id }: { title: string; extra?: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-2 flex items-baseline justify-between gap-2 px-0.5 font-display text-lg font-semibold tracking-wide text-steel uppercase">
      {title}
      {extra !== undefined && <small className="font-sans text-sm font-normal tracking-normal text-muted-foreground normal-case">{extra}</small>}
    </h2>
  );
}
