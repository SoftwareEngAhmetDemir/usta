import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { Machine } from '../../api';
import { useApi } from '../../api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageTitle } from '../../components/PageTitle';
import { ProgressBar } from '../../components/ProgressBar';
import { CameraView } from './components/CameraView';
import { MachineSelect } from './components/MachineSelect';
import { ProcessingPanel } from './components/ProcessingPanel';
import { RecordControls } from './components/RecordControls';
import { SavePanel } from './components/SavePanel';
import { useCamera } from './hooks/useCamera';
import { useRecorder } from './hooks/useRecorder';
import { useVideoUpload } from './hooks/useVideoUpload';

/** Machine first (QR → machine page → "Video çek", or the list), then record → preview → save → upload → processing
 * (KAN-35, 36, 73, 74). Without a known machine there is no camera, recording or file picking. */
export function RecorderPage() {
  const preset = Number(useSearchParams()[0].get('machine')) || null;
  const [machineId, setMachineId] = useState<number | null>(preset);
  const machines = useApi<Pick<Machine, 'id' | 'code' | 'name'>[]>('/me/machines');
  const camera = useCamera();
  const rec = useRecorder(camera.stream);
  const up = useVideoUpload();

  if (up.state.status === 'done') {
    const again = () => { up.reset(); rec.discard(); };
    return (<><PageTitle title="Video çek" back /><ProcessingPanel initial={up.state.video} onAgain={again} /></>);
  }
  const uploading = up.state.status === 'uploading';
  const list = machines.state.status === 'ok' ? machines.state.data : [];
  // A ?machine= this user may not record on does not count as chosen.
  const chosen = machineId !== null && list.some((m) => m.id === machineId) ? machineId : null;

  return (
    <>
      <PageTitle title="Video çek" back />
      {machines.state.status === 'ok' && <MachineSelect machines={list} value={chosen} onChange={setMachineId} />}
      <ErrorMessage error={machines.state.status === 'error' ? machines.state.error : null} onRetry={machines.reload} />
      {chosen === null && list.length > 0 && (
        <p className="muted">
          Önce videonun hangi makine için olduğunu seçin: listeden seçin ya da <Link to="/scan">makinenin QR kodunu okutun</Link>.
        </p>
      )}
      {chosen !== null && (
        <>
          <CameraView stream={camera.stream} previewUrl={rec.clip?.url ?? null} recordingSec={rec.recording ? rec.seconds : null} />
          {(camera.error ?? rec.error) && <div className="alert-error" role="alert">{camera.error ?? rec.error}</div>}
          {rec.clip ? (
            <>
              {up.state.status === 'uploading' && <ProgressBar fraction={up.state.progress} label="Yükleniyor" />}
              {up.state.status === 'error' && <ErrorMessage error={up.state.error} />}
              <SavePanel
                saving={uploading}
                onRetake={() => { rec.discard(); up.reset(); }}
                onSave={(title) => { if (rec.clip) void up.upload(chosen, title, rec.clip); }}
              />
              {up.state.status === 'error' && <p className="muted" style={{ margin: 0 }}>Kayıt telefonda duruyor; "Kaydet" ile tekrar deneyin.</p>}
            </>
          ) : (
            <RecordControls cameraOn={camera.stream !== null} recording={rec.recording} onOpenCamera={() => void camera.start()} onStart={rec.start} onStop={rec.stop} onFlip={() => void camera.flip()} onPick={rec.pick} />
          )}
        </>
      )}
    </>
  );
}
