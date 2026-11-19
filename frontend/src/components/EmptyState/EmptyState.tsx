import type { ReactNode } from 'react';

/** Short Turkish message for an empty section, with an optional action (e.g. "Video çek"). */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="row wrap">
      <p className="muted grow" style={{ margin: 0 }}>{message}</p>
      {action}
    </div>
  );
}
