import { useState } from 'react';
import { useSearchParams } from 'react-router';
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

/** Record → preview → retake/save → upload with progress → processing (KAN-35, 36, 73, 74). */
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

  return (
    <>
      <PageTitle title="Video çek" back />
      {machines.state.status === 'ok' && <MachineSelect machines={machines.state.data} value={machineId} onChange={setMachineId} />}
      <ErrorMessage error={machines.state.status === 'error' ? machines.state.error : null} onRetry={machines.reload} />
      <CameraView stream={camera.stream} previewUrl={rec.clip?.url ?? null} recordingSec={rec.recording ? rec.seconds : null} />
      {(camera.error ?? rec.error) && <div className="alert-error" role="alert">{camera.error ?? rec.error}</div>}
      {rec.clip ? (
        <>
          {up.state.status === 'uploading' && <ProgressBar fraction={up.state.progress} label="Yükleniyor" />}
          {up.state.status === 'error' && <ErrorMessage error={up.state.error} />}
          <SavePanel
            saving={uploading}
            canSave={machineId !== null}
            onRetake={() => { rec.discard(); up.reset(); }}
            onSave={(title) => { if (machineId !== null && rec.clip) void up.upload(machineId, title, rec.clip); }}
          />
          {up.state.status === 'error' && <p className="muted" style={{ margin: 0 }}>Kayıt telefonda duruyor; "Kaydet" ile tekrar deneyin.</p>}
        </>
      ) : (
        <RecordControls cameraOn={camera.stream !== null} recording={rec.recording} onOpenCamera={() => void camera.start()} onStart={rec.start} onStop={rec.stop} onFlip={() => void camera.flip()} onPick={rec.pick} />
      )}
    </>
  );
}
