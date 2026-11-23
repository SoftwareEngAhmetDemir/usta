import type { ReactNode } from 'react';
import { useT } from '../../i18n';

/** Label + control + error. `htmlFor` must match the control's id. `label` comes translated, `error` in Turkish. */
export function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  const t = useT();
  return (
    <div className="field">
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <span className="error" role="alert">{t(error)}</span>}
    </div>
  );
}
