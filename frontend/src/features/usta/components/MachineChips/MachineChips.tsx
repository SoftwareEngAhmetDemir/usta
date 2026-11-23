import { Link } from 'react-router';
import type { UstaProfile } from '../../../../api';
import { useT } from '../../../../i18n';

export function MachineChips({ machines }: { machines: UstaProfile['machines'] }) {
  const t = useT();
  return (
    <div className="chips">
      {machines.length === 0 && <span className="muted">{t('Henüz bağlı makine yok.')}</span>}
      {machines.map((m) => <Link key={m.id} className="chip" to={`/m/${m.id}`}>{m.code} · {m.name}</Link>)}
      <Link className="chip" to="/machines/new">{t('+ Makine ekle')}</Link>
    </div>
  );
}
