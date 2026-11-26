import { Link } from 'react-router';
import type { AdminUser } from '../../../../api';
import { Pill } from '../../../../components/Pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { ROLE_LABEL } from '../../../auth';
import { useT } from '../../../../i18n';

export function UserTable({ users }: { users: AdminUser[] }) {
  const t = useT();
  const head = 'h-10 text-xs font-semibold tracking-wide text-muted-foreground uppercase';
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>{[t('Ad'), t('Rol'), t('Yetki'), t('Makineler')].map((h) => <TableHead key={h} className={head}>{h}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                {/* An usta opens their profile: machines → machine page with videos and documents. */}
                {u.role === 'usta' ? <Link className="font-bold text-steel underline underline-offset-2" to={`/ustas/${u.id}`}>{u.name}</Link> : <b>{u.name}</b>}
              </TableCell>
              <TableCell><Pill tone="info">{t(ROLE_LABEL[u.role])}</Pill></TableCell>
              <TableCell className="whitespace-normal">
                {u.authorized ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Pill tone="ok">{t('Yetkili')}</Pill> <span className="text-muted-foreground">{u.authorization_note}</span>
                    {u.authorization_document_url && <a className="text-steel underline underline-offset-2" href={u.authorization_document_url} target="_blank" rel="noreferrer">{t('Belge')}</a>}
                  </span>
                ) : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="whitespace-normal">{u.machines.length ? u.machines.map((m) => m.name).join(', ') : <span className="text-muted-foreground">—</span>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
