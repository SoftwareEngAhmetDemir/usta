import { Link } from 'react-router';
import type { AdminMachineRow } from '../../../../api';
import { formatDate } from '../../../../lib/format';
import { useT } from '../../../../i18n';

/** One row per machine: ustas, last maintenance (date + person), video and document counts (KAN-32). */
export function MachineTable({ rows }: { rows: AdminMachineRow[] }) {
  const t = useT();
  if (rows.length === 0) return <p className="muted">{t('Makine bulunamadı.')}</p>;
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr><th>{t('Makine')}</th><th>{t('Konum')}</th><th>{t('Ustalar')}</th><th>{t('Son bakım')}</th><th>{t('Video')}</th><th>{t('Doküman')}</th><th><span className="sr-only">{t('Aç')}</span></th></tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td><b>{m.name}</b><br /><span className="muted">{m.code} · {m.serial}</span></td>
              <td>{m.location}</td>
              <td>{m.ustas.length ? m.ustas.map((u) => u.name).join(', ') : <span className="pill bad">{t('Usta yok')}</span>}</td>
              <td>{m.last_maintenance ? `${formatDate(m.last_maintenance.date)} · ${m.last_maintenance.by_name}` : <span className="muted">—</span>}</td>
              <td className="num">{m.video_count}</td>
              <td className="num">{m.document_count}</td>
              <td><Link className="btn" data-variant="secondary" data-size="small" to={`/m/${m.id}`}>{t('Sayfayı aç')}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
