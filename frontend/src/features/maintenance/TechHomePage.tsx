import { Link } from 'react-router';
import type { MaintenanceRecord } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { EmptyState } from '../../components/EmptyState';
import { MaintenanceTimeline } from '../../components/MaintenanceTimeline';
import { SectionTitle } from '../../components/SectionTitle';
import { useMe } from '../auth';
import { MeCard } from './components/MeCard';
import { useT } from '../../i18n';

/** Technician home: his authorized status, scan to open a machine, his recent jobs. */
export function TechHomePage() {
  const t = useT();
  const me = useMe();
  const { state, reload } = useApi<MaintenanceRecord[]>('/me/maintenance');
  return (
    <>
      <MeCard me={me} />
      <Link className="cta" to="/scan">
        <span className="ic" aria-hidden="true">⌁</span>
        <span className="grow"><b>{t('Makinenin QR\'ını tara')}</b><small>{t('Makine sayfasından "Bakım kaydı" açın')}</small></span>
      </Link>
      <SectionTitle title={t('Son kayıtlarım')} />
      <AsyncView state={state} onRetry={reload}>
        {(records) => (
          <div className="card">
            {records.length === 0 ? <EmptyState message={t('Henüz bakım kaydınız yok.')} /> : <MaintenanceTimeline records={records} showMachine />}
          </div>
        )}
      </AsyncView>
    </>
  );
}
