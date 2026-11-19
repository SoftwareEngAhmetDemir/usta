import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { MaintenanceFormOptions } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageTitle } from '../../components/PageTitle';
import { ProgressBar } from '../../components/ProgressBar';
import { useMe } from '../auth';
import { createMaintenance, type MaintenanceIn } from './api';
import { MaintenanceForm } from './components/MaintenanceForm';
import { MeCard } from './components/MeCard';

/** Record a maintenance job; then the machine page shows it at the top of the history. */
export function MaintenanceFormPage() {
  const { machineId = '' } = useParams();
  const me = useMe();
  const navigate = useNavigate();
  const { state, reload } = useApi<MaintenanceFormOptions>(`/machines/${machineId}/maintenance-form`);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);

  async function save(body: MaintenanceIn) {
    setError(null);
    setProgress(0);
    try {
      const rec = await createMaintenance(machineId, body, setProgress);
      navigate(`/m/${machineId}`, { replace: true, state: { highlight: rec.id } });
    } catch (e: unknown) {
      setError(e);
      setProgress(null);
    }
  }

  return (
    <>
      <PageTitle title="Bakım kaydı" back />
      <AsyncView state={state} onRetry={reload}>
        {(opts) => (
          <>
            <div className="card">
              <div className="strong">{opts.machine.name}</div>
              <div className="muted">{opts.machine.code} · {opts.machine.model} · {opts.machine.location}</div>
            </div>
            <div className="label">Yapan</div>
            <MeCard me={me} note="giriş yapan kullanıcı" />
            {progress !== null && <ProgressBar fraction={progress} label="Kaydediliyor" />}
            <ErrorMessage error={error} />
            <MaintenanceForm openers={opts.openers} saving={progress !== null} onSave={save} />
          </>
        )}
      </AsyncView>
    </>
  );
}
