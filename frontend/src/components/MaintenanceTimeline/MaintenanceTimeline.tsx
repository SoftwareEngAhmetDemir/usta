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
    <ol className="tl">
      {records.map((r) => (
        <li key={r.id} className={r.id === highlightId ? 'tl-item new' : 'tl-item'} aria-current={r.id === highlightId || undefined}>
          <span className="tl-dot" aria-hidden="true" />
          <div>
            <div className="strong">{r.description}</div>
            <div className="muted">
              {showMachine && `${r.machine_name} · `}
              <time dateTime={r.created_at}>{formatDateTime(r.created_at)}</time>
            </div>
            <div className="muted">
              {t('Yapan:')}{' '}<b>{r.done_by.name}</b> <AuthorizedBadge person={r.done_by} />{' '}{t('· Açan:')}{' '}{r.opened_by.name}
            </div>
            {r.attachments.length > 0 && (
              <div className="attachments">
                {r.attachments.map((a) =>
                  a.kind === 'photo' ? (
                    <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                      <img src={a.url} alt={t('Bakım fotoğrafı')} loading="lazy" />
                    </a>
                  ) : (
                    <video key={a.id} src={a.url} controls preload="none" width={160} aria-label={t('Bakım videosu')} />
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
