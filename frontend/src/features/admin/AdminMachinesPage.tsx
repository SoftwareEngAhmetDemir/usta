import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { AdminMachineList } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { PageTitle } from '../../components/PageTitle';
import { addExternalVideo, uploadDocument } from './api';
import { AdminTabs } from './components/AdminTabs';
import { DocumentUploadForm } from './components/DocumentUploadForm';
import { ExternalVideoForm } from './components/ExternalVideoForm';
import { MachineTable } from './components/MachineTable';
import { StatsTiles } from './components/StatsTiles';
import { useFormSubmit } from './hooks/useFormSubmit';
import type { ExternalVideoSubmit } from './types';
import { useT } from '../../i18n';

/** Patron: machine overview with search, document upload and outside videos (KAN-32, 33, 34). */
export function AdminMachinesPage() {
  const t = useT();
  const preset = Number(useSearchParams()[0].get('machine')) || null;
  const [q, setQ] = useState('');
  const { state, reload } = useApi<AdminMachineList>(`/admin/machines?q=${encodeURIComponent(q)}`);
  const doc = useFormSubmit(uploadDocument);
  const ext = useFormSubmit(({ machineId, ...body }: ExternalVideoSubmit) => addExternalVideo(machineId, body));
  const after = (ok: boolean) => { if (ok) reload(); };

  return (
    <>
      <PageTitle title={t('Yönetim')} />
      <AdminTabs />
      <Link className="btn" data-variant="secondary" to="/machines/new">{t('+ Makine ekle')}</Link>
      <div className="field">
        <label className="sr-only" htmlFor="admin-q">{t('Makine ara')}</label>
        <input id="admin-q" type="search" placeholder={t('Makine adıyla ara…')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <AsyncView state={state} onRetry={reload}>
        {(data) => (
          <>
            <StatsTiles stats={data.stats} />
            <MachineTable rows={data.machines} />
            <div className="tiles" style={{ alignItems: 'start' }}>
              <DocumentUploadForm machines={data.machines} defaultMachineId={preset} state={doc.state} onSubmit={(b) => void doc.submit(b).then(after)} />
              <ExternalVideoForm machines={data.machines} defaultMachineId={preset} state={ext.state} onSubmit={(b) => void ext.submit(b).then(after)} />
            </div>
          </>
        )}
      </AsyncView>
    </>
  );
}
