import { Link } from 'react-router';
import type { VideoProcessing } from '../../../../api';
import { useApi } from '../../../../api';
import { StepList } from '../../../../components/StepList';

const POLL_MS = 3000;

/** After upload: compress → transcribe → index, polled from the backend (KAN-37). */
export function ProcessingPanel({ initial, onAgain }: { initial: VideoProcessing; onAgain: () => void }) {
  const { state } = useApi<VideoProcessing>(`/videos/${initial.id}/processing`, (v) => (v.status === 'processing' ? POLL_MS : undefined));
  const v = state.status === 'ok' ? state.data : initial;
  return (
    <section className="stack" aria-live="polite">
      <div className="card"><StepList steps={v.steps} /></div>
      {v.status === 'ready' && (
        <div className="card stack">
          <span className="pill ok">Hazır</span>
          <p style={{ margin: 0 }}>Video makine sayfasında. İşçiler kendi dillerinde istediğinde altyazı ve dublaj hazırlanacak.</p>
          <Link className="btn" data-variant="secondary" to={`/videos/${v.id}`}>Videoyu aç</Link>
        </div>
      )}
      {v.status === 'failed' && <div className="alert-error" role="alert">Video işlenemedi. Lütfen tekrar yükleyin.</div>}
      <button type="button" className="btn" data-variant="secondary" onClick={onAgain}>Yeni video çek</button>
    </section>
  );
}
