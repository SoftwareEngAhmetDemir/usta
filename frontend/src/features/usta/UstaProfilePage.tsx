import { useParams } from 'react-router';
import type { UstaProfile } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { EmptyState } from '../../components/EmptyState';
import { PageTitle } from '../../components/PageTitle';
import { QaCard } from '../../components/QaCard';
import { SectionTitle } from '../../components/SectionTitle';
import { MachineChips } from './components/MachineChips';

/** Usta profile: the machines he knows and the questions he answered (KAN-28, KAN-65). */
export function UstaProfilePage() {
  const { ustaId = '' } = useParams();
  const { state, reload } = useApi<UstaProfile>(`/ustas/${ustaId}`);
  return (
    <>
      <PageTitle title="Usta" back />
      <AsyncView state={state} onRetry={reload}>
        {(p) => (
          <>
            <div className="card stack">
              <h2 style={{ margin: 0 }}>🧰 {p.name}</h2>
              <div className="label">Bildiği makineler</div>
              <MachineChips machines={p.machines} />
            </div>
            <SectionTitle title="Cevapladığı sorular" extra={p.answered.length} />
            <div className="card">
              {p.answered.length === 0 ? <EmptyState message="Henüz cevap yok." /> : p.answered.map((q) => <QaCard key={q.id} entry={q} showMachine />)}
            </div>
          </>
        )}
      </AsyncView>
    </>
  );
}
