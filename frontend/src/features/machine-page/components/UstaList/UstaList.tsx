import { UserRound } from 'lucide-react';
import { Link } from 'react-router';
import type { PersonRef } from '../../../../api';
import { Chip } from '../../../../components/Chip';
import { Card } from '../../../../components/ui/card';
import { useT } from '../../../../i18n';

export function UstaList({ ustas }: { ustas: PersonRef[] }) {
  const t = useT();
  return (
    <Card asChild className="gap-2"><section aria-labelledby="ustas-title">
      <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase" id="ustas-title">{t('Bu makineyi bilen ustalar')}</div>
      {ustas.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">{t('Henüz bağlı usta yok.')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ustas.map((u) => <Chip key={u.id} asChild><Link to={`/ustas/${u.id}`}><UserRound aria-hidden="true" />{u.name}</Link></Chip>)}
        </div>
      )}
    </section></Card>
  );
}
