import type { Alert } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { formatDateTime } from '../../../../lib/format';

export function AlertList({ items, onOpen }: { items: Alert[]; onOpen: (alert: Alert) => void }) {
  if (items.length === 0) return <div className="card"><EmptyState message="Bildirim yok." /></div>;
  return (
    <div className="card">
      {items.map((a) => (
        <button key={a.id} type="button" className="list-item" onClick={() => onOpen(a)}>
          <span className="thumb alert" aria-hidden="true">🔔</span>
          <span className="grow">
            <span className={a.read ? undefined : 'unread'}>{a.text}</span>
            {!a.read && <span className="sr-only"> (okunmamış)</span>}
            <br />
            <span className="muted">{formatDateTime(a.created_at)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
