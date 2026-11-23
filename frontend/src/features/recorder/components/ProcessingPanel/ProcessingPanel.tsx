import { Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../../../../components/Button';
import { Notice } from '../../../../components/Notice';
import { Card } from '../../../../components/ui/card';
import type { VideoProcessing } from '../../../../api';
import { useApi } from '../../../../api';
import { StepList } from '../../../../components/StepList';
import { useT } from '../../../../i18n';

const POLL_MS = 3000;

/** After upload: compress → transcribe → index, polled from the backend (KAN-37). */
export function ProcessingPanel({ initial, onAgain }: { initial: VideoProcessing; onAgain: () => void }) {
  const t = useT();
  const { state } = useApi<VideoProcessing>(`/videos/${initial.id}/processing`, (v) => (v.status === 'processing' ? POLL_MS : undefined));
  const v = state.status === 'ok' ? state.data : initial;
  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <Card><StepList steps={v.steps} /></Card>
      {v.status === 'ready' && (
        <>
          <Notice tone="ok" title={t('Hazır')}>{t('Video makine sayfasında. İşçiler kendi dillerinde istediğinde altyazı ve dublaj hazırlanacak.')}</Notice>
          <Button asChild><Link to={`/videos/${v.id}`}><Play aria-hidden="true" />{t('Videoyu aç')}</Link></Button>
        </>
      )}
      {v.status === 'failed' && <Notice tone="bad">{t('Video işlenemedi. Lütfen tekrar yükleyin.')}</Notice>}
      <Button variant="secondary" onClick={onAgain}><RotateCcw aria-hidden="true" />{t('Yeni video çek')}</Button>
    </section>
  );
}
