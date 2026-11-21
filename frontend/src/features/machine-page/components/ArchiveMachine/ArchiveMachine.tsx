import { useState } from 'react';
import { Button } from '../../../../components/Button';
import { ErrorMessage } from '../../../../components/ErrorMessage';

interface Props {
  pending: boolean;
  error: unknown;
  onConfirm: () => void;
}

/** "Makineyi kaldır" with a confirm step; the backend archives, so history is kept (KAN-27). */
export function ArchiveMachine({ pending, error, onConfirm }: Props) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <Button variant="secondary" onClick={() => setAsking(true)}>Makineyi kaldır</Button>;
  return (
    <div className="card stack">
      <span>Makine listelerden kalkar. Videoları, dokümanları ve bakım geçmişi silinmez; patron geri alabilir.</span>
      <div className="row">
        <Button variant="danger" loading={pending} onClick={onConfirm}>Evet, kaldır</Button>
        <Button variant="secondary" onClick={() => setAsking(false)}>Vazgeç</Button>
      </div>
      <ErrorMessage error={error} />
    </div>
  );
}
