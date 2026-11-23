import type { MaintenanceRecord } from '../../api';
import { formatDateTime } from '../../lib/format';
import { AuthorizedBadge } from '../AuthorizedBadge';
import { useT } from '../../i18n';

interface Props {
  records: MaintenanceRecord[]; // newest first, as the API sends them
  highlightId?: number; // a record that was just added
  showMachine?: boolean;
}

export function MaintenanceTimeline({ records, highlightId, showMachine = false }: Props) {
  const t = useT();
  return (
    <ol className="m-0 list-none p-0">
      {records.map((r) => (
        <li
          key={r.id}
          aria-current={r.id === highlightId || undefined}
          className="group relative grid grid-cols-[14px_1fr] gap-3 pb-4 last:pb-0 before:absolute before:start-[6px] before:top-5 before:bottom-0 before:w-0.5 before:bg-border last:before:hidden"
        >
          <span className="mt-1 size-3.5 rounded-full bg-steel group-aria-current:bg-primary group-aria-current:ring-4 group-aria-current:ring-accent" aria-hidden="true" />
          <div className="min-w-0 space-y-0.5">
            <div className="font-semibold">{r.description}</div>
            <div className="text-sm text-muted-foreground">
              {showMachine && `${r.machine_name} · `}
              <time dateTime={r.created_at}>{formatDateTime(r.created_at)}</time>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {t('Yapan:')} <b className="text-foreground">{r.done_by.name}</b> <AuthorizedBadge person={r.done_by} /> {t('· Açan:')} {r.opened_by.name}
            </div>
            {r.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {r.attachments.map((a) =>
                  a.kind === 'photo' ? (
                    <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                      <img src={a.url} alt={t('Bakım fotoğrafı')} loading="lazy" className="h-14 w-20 rounded-md border object-cover" />
                    </a>
                  ) : (
                    <video key={a.id} src={a.url} controls preload="none" width={160} aria-label={t('Bakım videosu')} className="rounded-md" />
                  ),
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
