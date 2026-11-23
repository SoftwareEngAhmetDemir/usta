import { UserRound } from 'lucide-react';
import { useParams } from 'react-router';
import { Card } from '../../components/ui/card';
import type { UstaProfile } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { EmptyState } from '../../components/EmptyState';
import { PageTitle } from '../../components/PageTitle';
import { QaCard } from '../../components/QaCard';
import { SectionTitle } from '../../components/SectionTitle';
import { MachineChips } from './components/MachineChips';
import { useT } from '../../i18n';

/** Usta profile: the machines he knows and the questions he answered (KAN-28, KAN-65). */
export function UstaProfilePage() {
  const t = useT();
  const { ustaId = '' } = useParams();
  const { state, reload } = useApi<UstaProfile>(`/ustas/${ustaId}`);
  return (
    <>
      <PageTitle title={t('Usta')} back />
      <AsyncView state={state} onRetry={reload}>
        {(p) => (
          <>
            <Card>
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-steel text-steel-foreground" aria-hidden="true"><UserRound className="size-6" /></span>
                <h2 className="m-0 text-xl font-semibold">{p.name}</h2>
              </div>
              <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('Bildiği makineler')}</div>
              <MachineChips machines={p.machines} />
            </Card>
            <SectionTitle title={t('Cevapladığı sorular')} extra={p.answered.length} />
            {p.answered.length === 0 ? <EmptyState message={t('Henüz cevap yok.')} /> : (
              <Card className="gap-0">{p.answered.map((q) => <QaCard key={q.id} entry={q} showMachine />)}</Card>
            )}
          </>
        )}
      </AsyncView>
    </>
  );
}
