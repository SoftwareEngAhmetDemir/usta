import type { Me } from '../../../../api';
import { useT } from '../../../../i18n';

/** The logged-in technician with his authorized status (KAN-26). */
export function MeCard({ me, note }: { me: Me; note?: string }) {
  const t = useT();
  return (
    <div className="card row">
      <span className="thumb" style={{ background: me.authorized ? 'var(--ok)' : undefined }} aria-hidden="true">{me.authorized ? '✓' : '🔧'}</span>
      <div className="grow">
        <div className="strong">{me.name}</div>
        <div className="muted">
          {me.authorized ? <span className="pill ok">{t('Yetkili')}</span> : <span className="pill warn">{t('Yetki belgesi yok')}</span>} {me.authorization_note}
          {note && <> · {note}</>}
        </div>
      </div>
    </div>
  );
}
