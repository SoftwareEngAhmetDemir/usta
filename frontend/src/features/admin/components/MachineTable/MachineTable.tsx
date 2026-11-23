import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import type { AdminMachineRow } from '../../../../api';
import { Button } from '../../../../components/Button';
import { Pill } from '../../../../components/Pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { formatDate } from '../../../../lib/format';
import { useT } from '../../../../i18n';

/** One row per machine: ustas, last maintenance (date + person), video and document counts (KAN-32). */
export function MachineTable({ rows }: { rows: AdminMachineRow[] }) {
  const t = useT();
  if (rows.length === 0) return <p className="m-0 text-sm text-muted-foreground">{t('Makine bulunamadı.')}</p>;
  const head = 'h-10 text-xs font-semibold tracking-wide text-muted-foreground uppercase';
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {[t('Makine'), t('Konum'), t('Ustalar'), t('Son bakım'), t('Video'), t('Doküman')].map((h) => <TableHead key={h} className={head}>{h}</TableHead>)}
            <TableHead className={head}><span className="sr-only">{t('Aç')}</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => (
            <TableRow key={m.id}>
              <TableCell><b>{m.name}</b><div className="font-mono text-xs text-muted-foreground">{m.code} · {m.serial}</div></TableCell>
              <TableCell>{m.location}</TableCell>
              <TableCell className="whitespace-normal">{m.ustas.length ? m.ustas.map((u) => u.name).join(', ') : <Pill tone="bad">{t('Usta yok')}</Pill>}</TableCell>
              <TableCell>{m.last_maintenance ? `${formatDate(m.last_maintenance.date)} · ${m.last_maintenance.by_name}` : <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell className="text-end tabular-nums">{m.video_count}</TableCell>
              <TableCell className="text-end tabular-nums">{m.document_count}</TableCell>
              <TableCell className="text-end">
                <Button asChild variant="secondary" size="small"><Link to={`/m/${m.id}`}>{t('Sayfayı aç')}<ArrowUpRight aria-hidden="true" /></Link></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
