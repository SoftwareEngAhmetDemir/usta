export type PillTone = 'ok' | 'warn' | 'bad' | 'info';

/** Soft status colours, shared by Pill and badge-like links. */
export const TONE_CLASS: Record<PillTone, string> = {
  ok: 'bg-success/12 text-success',
  warn: 'bg-warning/12 text-warning',
  bad: 'bg-destructive/10 text-destructive',
  info: 'bg-secondary text-secondary-foreground',
};
