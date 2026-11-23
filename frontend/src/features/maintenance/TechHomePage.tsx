import { ScanLine } from 'lucide-react';
import type { MaintenanceRecord } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { CtaLink } from '../../components/CtaLink';
import { Card } from '../../components/ui/card';
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
      <CtaLink to="/scan" icon={ScanLine} title={t('Makinenin QR\'ını tara')} hint={t('Makine sayfasından "Bakım kaydı" açın')} />
      <SectionTitle title={t('Son kayıtlarım')} />
      <AsyncView state={state} onRetry={reload}>
        {(records) => (
          records.length === 0 ? <EmptyState message={t('Henüz bakım kaydınız yok.')} /> : <Card><MaintenanceTimeline records={records} showMachine /></Card>
        )}
      </AsyncView>
    </>
  );
}
