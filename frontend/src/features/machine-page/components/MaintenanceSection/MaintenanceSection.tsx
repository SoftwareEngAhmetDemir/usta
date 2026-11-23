import { CircleCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import type { MaintenanceRecord } from '../../../../api';
import { Button } from '../../../../components/Button';
import { EmptyState } from '../../../../components/EmptyState';
import { MaintenanceTimeline } from '../../../../components/MaintenanceTimeline';
import { SectionTitle } from '../../../../components/SectionTitle';
import { Card } from '../../../../components/ui/card';
import { useT } from '../../../../i18n';

interface Props {
  machineId: number;
  records: MaintenanceRecord[];
  canRecord: boolean;
  highlightId?: number;
}

export function MaintenanceSection({ machineId, records, canRecord, highlightId }: Props) {
  const t = useT();
  return (
    <section aria-labelledby="maint-title" className="flex flex-col gap-2">
      <SectionTitle id="maint-title" title={t('Bakım geçmişi')} extra={`${records.length} ${t('kayıt')}`} />
      {highlightId !== undefined && (
        <output className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/8 p-3 text-sm">
          <CircleCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
          <span><b className="text-success">{t('Kaydedildi')}</b> {t('Bakım kaydı geçmişin en üstünde.')}</span>
        </output>
      )}
      {canRecord && (
        <Button asChild variant="secondary"><Link to={`/m/${machineId}/maintenance`}><Wrench aria-hidden="true" />{t('Bakım kaydı')}</Link></Button>
      )}
      {records.length === 0 ? <EmptyState message={t('Henüz bakım kaydı yok.')} /> : <Card><MaintenanceTimeline records={records} highlightId={highlightId} /></Card>}
    </section>
  );
}
