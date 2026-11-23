import type { ReactNode } from 'react';

/** Short Turkish message for an empty section, with an optional action (e.g. "Video çek"). */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-input bg-card/60 p-4">
      <p className="m-0 min-w-0 flex-1 text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
