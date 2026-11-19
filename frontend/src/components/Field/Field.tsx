import type { ReactNode } from 'react';

/** Label + control + error. `htmlFor` must match the control's id. */
export function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <span className="error" role="alert">{error}</span>}
    </div>
  );
}
