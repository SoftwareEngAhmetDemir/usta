import { Archive, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/Button';
import { ErrorMessage } from '../../../../components/ErrorMessage';
import { Card } from '../../../../components/ui/card';
import { useT } from '../../../../i18n';

interface Props {
  pending: boolean;
  error: unknown;
  onConfirm: () => void;
}

/** "Makineyi kaldır" with a confirm step; the backend archives, so history is kept (KAN-27). */
export function ArchiveMachine({ pending, error, onConfirm }: Props) {
  const t = useT();
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="secondary" className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={() => setAsking(true)}>
        <Archive aria-hidden="true" />
        {t('Makineyi kaldır')}
      </Button>
    );
  }
  return (
    <Card className="mt-4 border-destructive/30 bg-destructive/5">
      <p className="m-0 flex gap-2 text-sm">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        {t('Makine listelerden kalkar. Videoları, dokümanları ve bakım geçmişi silinmez; patron geri alabilir.')}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="danger" loading={pending} onClick={onConfirm}>{t('Evet, kaldır')}</Button>
        <Button variant="secondary" onClick={() => setAsking(false)}>{t('Vazgeç')}</Button>
      </div>
      <ErrorMessage error={error} />
    </Card>
  );
}
