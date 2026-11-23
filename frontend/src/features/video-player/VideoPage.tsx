import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { AsyncView } from '../../components/AsyncView';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageTitle } from '../../components/PageTitle';
import { formatDate } from '../../lib/format';
import { Player } from './components/Player';
import { PreparationCard } from './components/PreparationCard';
import { TrackPicker } from './components/TrackPicker';
import { Transcript } from './components/Transcript';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { useT } from '../../i18n';

/** Player in the worker's language; `?t=108` opens at that second (Ask the machine sources). */
export function VideoPage() {
  const t = useT();
  const videoId = Number(useParams().videoId);
  const startSec = Number(useSearchParams()[0].get('t') ?? 0) || 0;
  const p = useVideoPlayer(videoId);
  const [seek, setSeek] = useState({ sec: startSec, nonce: 0 });
  const [now, setNow] = useState(startSec);
  const jump = (sec: number) => setSeek((s) => ({ sec, nonce: s.nonce + 1 }));

  return (
    <>
      <PageTitle title={t('Video')} back />
      <AsyncView state={p.state} onRetry={p.reload}>
        {(v) => (
          <>
            {v.status !== 'ready' || !p.audio ? (
              <div className="card warn">{t('Video henüz işleniyor. Hazır olunca burada oynatılır.')}</div>
            ) : (
              <Player title={v.title} audio={p.audio} subtitle={p.subtitle} seek={seek} onTime={setNow} />
            )}
            <div className="card">
              <div className="strong">{v.title}</div>
              <div className="muted">
                {v.author_name} · {formatDate(v.created_at)} · <Link to={`/m/${v.machine_id}`}>{v.machine_name}</Link>
              </div>
            </div>
            {v.preparation && <PreparationCard preparation={v.preparation} onRetry={(step) => p.retry(v.preparation?.language ?? '', step)} />}
            <ErrorMessage error={p.error} />
            <TrackPicker
              tracks={v.tracks}
              audio={p.audio?.language ?? null}
              subtitle={p.subtitle?.language ?? null}
              onAudio={p.chooseAudio}
              onSubtitle={p.chooseSubtitle}
              onRequest={p.request}
            />
            <Transcript segments={v.transcript} lang={v.transcript_language} dir={v.transcript_dir} currentSec={now} onSeek={jump} />
          </>
        )}
      </AsyncView>
    </>
  );
}
