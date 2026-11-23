import type { ReactNode } from 'react';
import { useT } from '../../i18n';
import { Label } from '../ui/label';

/** Label + control + error. `htmlFor` must match the control's id. `label` comes translated, `error` in Turkish. */
export function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</Label>
      {children}
      {error && <span className="text-sm text-destructive" role="alert">{t(error, { quiet: true })}</span>}
    </div>
  );
}
