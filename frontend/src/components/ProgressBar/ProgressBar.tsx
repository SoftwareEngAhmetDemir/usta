import { Progress } from '../ui/progress';

export function ProgressBar({ fraction, label }: { fraction: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <Progress value={pct} aria-label={label} className="h-2.5 bg-muted [&>[data-slot=progress-indicator]]:bg-primary" />
      <span className="text-sm text-muted-foreground tabular-nums">{label} · %{pct}</span>
    </div>
  );
}
