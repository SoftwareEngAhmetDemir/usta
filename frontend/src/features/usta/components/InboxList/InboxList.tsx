import { Link } from 'react-router';
import type { InboxQuestion } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { Localized } from '../../../../components/Localized';
import { formatDateTime } from '../../../../lib/format';

export function InboxList({ items }: { items: InboxQuestion[] }) {
  if (items.length === 0) return <EmptyState message="Açık soru yok." />;
  return (
    <>
      {items.map((q) => (
        <Link key={q.id} className="list-item" to={`/usta/questions/${q.id}`}>
          <span className="thumb alert" aria-hidden="true">?</span>
          <span className="grow">
            <span className="strong"><Localized value={q.question} /></span>
            <br />
            <span className="muted">{q.machine_name} · {q.worker_name} · dili: {q.worker_language_name} · {formatDateTime(q.created_at)}</span>
          </span>
        </Link>
      ))}
    </>
  );
}
