import { Link } from 'react-router';
import type { QaEntry } from '../../api';
import { formatDate } from '../../lib/format';
import { Localized } from '../Localized';
import { useT } from '../../i18n';

/** One answered question, in the viewer's language with the original available. */
export function QaCard({ entry, showMachine = false }: { entry: QaEntry; showMachine?: boolean }) {
  const t = useT();
  const hasOriginal = entry.original_question !== null || entry.original_answer !== null;
  return (
    <article className="list-item" style={{ display: 'block' }}>
      <div className="strong">{t('S:')}{' '}<Localized value={entry.question} /></div>
      {entry.answer && <div>{t('C:')}{' '}<Localized value={entry.answer} /></div>}
      <div className="row wrap" style={{ marginTop: 4 }}>
        {entry.answer_video_id !== null && <Link className="chip" to={`/videos/${entry.answer_video_id}`}>{t('▶ Cevap videosu')}</Link>}
        {entry.answer_file_url && <a className="chip" href={entry.answer_file_url} target="_blank" rel="noreferrer">{t('📎 Ek dosya')}</a>}
      </div>
      <div className="muted">
        {showMachine && <><Link to={`/m/${entry.machine_id}`}>{entry.machine_name}</Link> · </>}
        <Link to={`/ustas/${entry.usta.id}`}>{entry.usta.name}</Link> · {formatDate(entry.answered_at)}
      </div>
      {hasOriginal && (
        <details>
          <summary className="muted">{t('Orijinalini göster')}</summary>
          {entry.original_question && <p style={{ margin: '4px 0' }}>{t('S:')}{' '}<Localized value={entry.original_question} /></p>}
          {entry.original_answer && <p style={{ margin: '4px 0' }}>{t('C:')}{' '}<Localized value={entry.original_answer} /></p>}
        </details>
      )}
    </article>
  );
}
