export function ProgressBar({ fraction, label }: { fraction: number; label: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <div className="stack">
      <progress className="progress" aria-label={label} max={100} value={pct} />
      <span className="muted">{label} · %{pct}</span>
    </div>
  );
}
