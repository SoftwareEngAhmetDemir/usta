import type { ReactNode } from 'react';
import { cn } from 'cn';

type Kind = 'video' | 'doc' | 'external' | 'alert';

const KIND: Record<Kind, string> = {
  video: 'bg-gradient-to-br from-steel to-[#1e2c36] text-white',
  doc: 'bg-secondary text-steel font-semibold',
  external: 'bg-[#7a1f1f] text-white',
  alert: 'bg-primary text-primary-foreground',
};

/** The square/landscape picture at the start of a list row (video frame, file type, alert icon). */
export function Thumb({ kind, wide = false, children }: { kind: Kind; wide?: boolean; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-lg text-base [&_img]:size-full [&_img]:object-cover [&_svg]:size-5',
        wide ? 'h-12 w-16' : 'size-11',
        KIND[kind],
      )}
    >
      {children}
    </span>
  );
}
