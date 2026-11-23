import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import type { UstaProfile } from '../../../../api';
import { Chip } from '../../../../components/Chip';
import { useT } from '../../../../i18n';

export function MachineChips({ machines }: { machines: UstaProfile['machines'] }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-2">
      {machines.length === 0 && <span className="self-center text-sm text-muted-foreground">{t('Henüz bağlı makine yok.')}</span>}
      {machines.map((m) => (
        <Chip key={m.id} asChild><Link to={`/m/${m.id}`}><b className="shrink-0 font-mono text-xs text-steel">{m.code}</b>{' · '}{m.name}</Link></Chip>
      ))}
      <Chip asChild className="border-dashed text-steel"><Link to="/machines/new"><Plus aria-hidden="true" />{t('Makine ekle')}</Link></Chip>
    </div>
  );
}
