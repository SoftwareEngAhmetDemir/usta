import type { Me } from '../../../../api';

/** The logged-in technician with his authorized status (KAN-26). */
export function MeCard({ me, note }: { me: Me; note?: string }) {
  return (
    <div className="card row">
      <span className="thumb" style={{ background: me.authorized ? 'var(--ok)' : undefined }} aria-hidden="true">{me.authorized ? '✓' : '🔧'}</span>
      <div className="grow">
        <div className="strong">{me.name}</div>
        <div className="muted">
          {me.authorized ? <span className="pill ok">Yetkili</span> : <span className="pill warn">Yetki belgesi yok</span>} {me.authorization_note}
          {note && <> · {note}</>}
        </div>
      </div>
    </div>
  );
}
