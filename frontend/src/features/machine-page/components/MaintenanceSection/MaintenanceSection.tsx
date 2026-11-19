import { Link } from 'react-router';
import type { MaintenanceRecord } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { MaintenanceTimeline } from '../../../../components/MaintenanceTimeline';
import { SectionTitle } from '../../../../components/SectionTitle';

interface Props {
  machineId: number;
  records: MaintenanceRecord[];
  canRecord: boolean;
  highlightId?: number;
}

export function MaintenanceSection({ machineId, records, canRecord, highlightId }: Props) {
  return (
    <section aria-labelledby="maint-title" className="stack">
      <SectionTitle id="maint-title" title="Bakım geçmişi" extra={`${records.length} kayıt`} />
      {highlightId !== undefined && <output className="card"><span className="pill ok">Kaydedildi</span> Bakım kaydı geçmişin en üstünde.</output>}
      {canRecord && <Link className="btn" data-variant="secondary" to={`/m/${machineId}/maintenance`}>🔧 Bakım kaydı</Link>}
      <div className="card">
        {records.length === 0 ? <EmptyState message="Henüz bakım kaydı yok." /> : <MaintenanceTimeline records={records} highlightId={highlightId} />}
      </div>
    </section>
  );
}
