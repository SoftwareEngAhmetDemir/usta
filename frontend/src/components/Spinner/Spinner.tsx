import { Loader2 } from 'lucide-react';
import { useT } from '../../i18n';

export function Spinner({ label }: { label?: string }) {
  const t = useT();
  return (
    <output className="flex justify-center py-10">
      <Loader2 className="size-7 animate-spin text-steel" aria-hidden="true" />
      <span className="sr-only">{label ?? t('Yükleniyor…')}</span>
    </output>
  );
}
