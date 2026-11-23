import { useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import type { InboxQuestion, MachineHit, UstaProfile } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { CtaLink } from '../../components/CtaLink';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/EmptyState';
import { QaCard } from '../../components/QaCard';
import { SectionTitle } from '../../components/SectionTitle';
import { useAlerts } from '../alerts';
import { useMe } from '../auth';
import { InboxList } from './components/InboxList';
import { MachineChips } from './components/MachineChips';
import { MachineSearch } from './components/MachineSearch';
import { useT } from '../../i18n';

/** Usta home (the patron's "Sorular" too): machine search, open questions, "Video çek", answers (KAN-62, KAN-65). */
export function UstaHomePage() {
  const t = useT();
  const me = useMe();
  const inbox = useApi<InboxQuestion[]>('/me/inbox');
  const { received } = useAlerts();
  const reloadInbox = inbox.reload;
  useEffect(() => { if (received) reloadInbox(); }, [received, reloadInbox]); // a worker's new question arrived live
  const profile = useApi<UstaProfile>(`/ustas/${me.id}`);
  const [q, setQ] = useState('');
  const search = useApi<MachineHit[]>(`/machines?q=${encodeURIComponent(q)}`);

  return (
    <>
      <Card>
        <div className="font-display text-2xl leading-none font-semibold text-steel">{t('Merhaba')} {me.name}</div>
        <AsyncView state={profile.state}>{(p) => <MachineChips machines={p.machines} />}</AsyncView>
      </Card>
      <MachineSearch query={q} onQueryChange={setQ} results={search.state} onRetry={search.reload} />
      <CtaLink to="/record" icon={Video} title={t('Video çek')} hint={t('Bir makineyi veya bakım işini anlat')} />
      <AsyncView state={inbox.state} onRetry={inbox.reload}>
        {(items) => (
          <>
            <SectionTitle title={t('İşçilerden sorular')} extra={`${items.length} ${t('açık')}`} />
            <InboxList items={items} />
          </>
        )}
      </AsyncView>
      <SectionTitle title={t('Cevapladıklarım')} />
      <AsyncView state={profile.state} onRetry={profile.reload}>
        {(p) => (
          p.answered.length === 0 ? <EmptyState message={t('Henüz cevap yok.')} /> : (
            <Card className="gap-0">{p.answered.map((q) => <QaCard key={q.id} entry={q} showMachine />)}</Card>
          )
        )}
      </AsyncView>
    </>
  );
}
