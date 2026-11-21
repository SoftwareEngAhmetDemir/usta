import { useEffect } from 'react';
import { Link } from 'react-router';
import type { InboxQuestion, UstaProfile } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { EmptyState } from '../../components/EmptyState';
import { QaCard } from '../../components/QaCard';
import { SectionTitle } from '../../components/SectionTitle';
import { useAlerts } from '../alerts';
import { useMe } from '../auth';
import { InboxList } from './components/InboxList';
import { MachineChips } from './components/MachineChips';

/** Usta home: open questions for his machines, "Video çek", and what he answered (KAN-62, KAN-65). */
export function UstaHomePage() {
  const me = useMe();
  const inbox = useApi<InboxQuestion[]>('/me/inbox');
  const { received } = useAlerts();
  const reloadInbox = inbox.reload;
  useEffect(() => { if (received) reloadInbox(); }, [received, reloadInbox]); // a worker's new question arrived live
  const profile = useApi<UstaProfile>(`/ustas/${me.id}`);

  return (
    <>
      <div className="card stack">
        <div className="strong">Merhaba {me.name}</div>
        <AsyncView state={profile.state}>{(p) => <MachineChips machines={p.machines} />}</AsyncView>
      </div>
      <Link className="cta" to="/record">
        <span className="ic" aria-hidden="true">●</span>
        <span className="grow"><b>Video çek</b><small>Bir makineyi veya bakım işini anlat</small></span>
      </Link>
      <AsyncView state={inbox.state} onRetry={inbox.reload}>
        {(items) => (
          <>
            <SectionTitle title="İşçilerden sorular" extra={`${items.length} açık`} />
            <div className="card"><InboxList items={items} /></div>
          </>
        )}
      </AsyncView>
      <SectionTitle title="Cevapladıklarım" />
      <AsyncView state={profile.state} onRetry={profile.reload}>
        {(p) => (
          <div className="card">
            {p.answered.length === 0 ? <EmptyState message="Henüz cevap yok." /> : p.answered.map((q) => <QaCard key={q.id} entry={q} showMachine />)}
          </div>
        )}
      </AsyncView>
    </>
  );
}
