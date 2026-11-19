import { Link } from 'react-router';
import type { UstaProfile } from '../../../../api';

export function MachineChips({ machines }: { machines: UstaProfile['machines'] }) {
  if (machines.length === 0) return <p className="muted" style={{ margin: 0 }}>Henüz bağlı makine yok.</p>;
  return (
    <div className="chips">
      {machines.map((m) => <Link key={m.id} className="chip" to={`/m/${m.id}`}>{m.code} · {m.name}</Link>)}
    </div>
  );
}
