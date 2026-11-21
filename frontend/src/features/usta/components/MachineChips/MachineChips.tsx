import { Link } from 'react-router';
import type { UstaProfile } from '../../../../api';

export function MachineChips({ machines }: { machines: UstaProfile['machines'] }) {
  return (
    <div className="chips">
      {machines.length === 0 && <span className="muted">Henüz bağlı makine yok.</span>}
      {machines.map((m) => <Link key={m.id} className="chip" to={`/m/${m.id}`}>{m.code} · {m.name}</Link>)}
      <Link className="chip" to="/machines/new">+ Makine ekle</Link>
    </div>
  );
}
