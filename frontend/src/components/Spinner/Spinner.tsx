import { useT } from '../../i18n';

export function Spinner({ label }: { label?: string }) {
  const t = useT();
  return (
    <output>
      <span className="spinner" style={{ display: 'block' }} aria-hidden="true" />
      <span className="sr-only">{label ?? t('Yükleniyor…')}</span>
    </output>
  );
}
