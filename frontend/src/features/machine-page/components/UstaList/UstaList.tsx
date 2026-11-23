import { Link } from 'react-router';
import type { PersonRef } from '../../../../api';
import { useT } from '../../../../i18n';

export function UstaList({ ustas }: { ustas: PersonRef[] }) {
  const t = useT();
  return (
    <section className="card" aria-labelledby="ustas-title">
      <div className="label" id="ustas-title">{t('Bu makineyi bilen ustalar')}</div>
      {ustas.length === 0 ? (
        <p className="muted" style={{ margin: '6px 0 0' }}>{t('Henüz bağlı usta yok.')}</p>
      ) : (
        <div className="chips" style={{ marginTop: 6 }}>
          {ustas.map((u) => <Link key={u.id} className="chip" to={`/ustas/${u.id}`}>🧰 {u.name}</Link>)}
        </div>
      )}
    </section>
  );
}
