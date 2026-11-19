import { Link } from 'react-router';
import type { AdminMachineRow } from '../../../../api';
import { formatDate } from '../../../../lib/format';

/** One row per machine: ustas, last maintenance (date + person), video and document counts (KAN-32). */
export function MachineTable({ rows }: { rows: AdminMachineRow[] }) {
  if (rows.length === 0) return <p className="muted">Makine bulunamadı.</p>;
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr><th>Makine</th><th>Konum</th><th>Ustalar</th><th>Son bakım</th><th>Video</th><th>Doküman</th><th><span className="sr-only">Aç</span></th></tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td><b>{m.name}</b><br /><span className="muted">{m.code} · {m.serial}</span></td>
              <td>{m.location}</td>
              <td>{m.ustas.length ? m.ustas.map((u) => u.name).join(', ') : <span className="pill bad">Usta yok</span>}</td>
              <td>{m.last_maintenance ? `${formatDate(m.last_maintenance.date)} · ${m.last_maintenance.by_name}` : <span className="muted">—</span>}</td>
              <td className="num">{m.video_count}</td>
              <td className="num">{m.document_count}</td>
              <td><Link className="btn" data-variant="secondary" data-size="small" to={`/m/${m.id}`}>Sayfayı aç</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
