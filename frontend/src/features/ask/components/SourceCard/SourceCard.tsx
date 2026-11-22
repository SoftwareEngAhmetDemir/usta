import { Link } from 'react-router';
import type { AnswerSource } from '../../../../api';
import { formatDate } from '../../../../lib/format';

/** Video source opens the player at that second (with a keyframe of that part); document source opens the file
 * at that page (KAN-61). Labels come from the backend. */
export function SourceCard({ source }: { source: AnswerSource }) {
  switch (source.kind) {
    case 'video':
      return (
        <Link className="src" to={`/videos/${source.video_id}?t=${source.start_sec}`}>
          {source.snapshot_urls[0] ? (
            <img className="k snap" src={source.snapshot_urls[0]} alt="" />
          ) : (
            <span className="k" aria-hidden="true">▶</span>
          )}
          <span className="grow">
            <span className="strong">{source.title}</span><br />
            <span className="where">VİDEO · {source.timestamp_label}</span> <span className="muted">· {source.usta_name}</span>
          </span>
        </Link>
      );
    case 'document':
      return (
        <Link className="src" to={`/documents/${source.document_id}?page=${source.page}`}>
          <span className="k" aria-hidden="true">📄</span>
          <span className="grow">
            <span className="strong">{source.title}</span><br />
            <span className="where">SAYFA {source.page}</span>
            {source.section_heading && <span className="muted"> · {source.section_heading}</span>}
          </span>
        </Link>
      );
    case 'usta_answer':
      return (
        <div className="src">
          <span className="k" aria-hidden="true">🧰</span>
          <span className="grow">
            <span className="strong">Ustanın önceki cevabı</span><br />
            <span className="where">{source.usta_name} · {formatDate(source.answered_at)}</span>
          </span>
        </div>
      );
  }
}
