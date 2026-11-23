import { useState } from 'react';
import { Button } from '../../../../components/Button';
import { ErrorMessage } from '../../../../components/ErrorMessage';
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
  if (!asking) return <Button variant="secondary" onClick={() => setAsking(true)}>{t('Makineyi kaldır')}</Button>;
  return (
    <div className="card stack">
      <span>{t('Makine listelerden kalkar. Videoları, dokümanları ve bakım geçmişi silinmez; patron geri alabilir.')}</span>
      <div className="row">
        <Button variant="danger" loading={pending} onClick={onConfirm}>{t('Evet, kaldır')}</Button>
        <Button variant="secondary" onClick={() => setAsking(false)}>{t('Vazgeç')}</Button>
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}
