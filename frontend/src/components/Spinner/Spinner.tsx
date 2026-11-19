export function Spinner({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <output>
      <span className="spinner" style={{ display: 'block' }} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </output>
  );
}
