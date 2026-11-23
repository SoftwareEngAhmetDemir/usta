import { Paperclip, Play } from 'lucide-react';
import { Link } from 'react-router';
import type { QaEntry } from '../../api';
import { formatDate } from '../../lib/format';
import { Chip } from '../Chip';
import { Localized } from '../Localized';
import { useT } from '../../i18n';

/** One answered question, in the viewer's language with the original available. */
export function QaCard({ entry, showMachine = false }: { entry: QaEntry; showMachine?: boolean }) {
  const t = useT();
  const hasOriginal = entry.original_question !== null || entry.original_answer !== null;
  return (
    <article className="flex flex-col gap-1.5 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="font-semibold">{t('S:')} <Localized value={entry.question} /></div>
      {entry.answer && <div>{t('C:')} <Localized value={entry.answer} /></div>}
      {(entry.answer_video_id !== null || entry.answer_file_url) && (
        <div className="flex flex-wrap gap-2">
          {entry.answer_video_id !== null && (
            <Chip asChild><Link to={`/videos/${entry.answer_video_id}`}><Play aria-hidden="true" />{t('Cevap videosu')}</Link></Chip>
          )}
          {entry.answer_file_url && (
            <Chip asChild><a href={entry.answer_file_url} target="_blank" rel="noreferrer"><Paperclip aria-hidden="true" />{t('Ek dosya')}</a></Chip>
          )}
        </div>
      )}
      <div className="text-sm text-muted-foreground [&_a]:text-steel [&_a]:underline-offset-2 hover:[&_a]:underline">
        {showMachine && <><Link to={`/m/${entry.machine_id}`}>{entry.machine_name}</Link> · </>}
        <Link to={`/ustas/${entry.usta.id}`}>{entry.usta.name}</Link> · {formatDate(entry.answered_at)}
      </div>
      {hasOriginal && (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">{t('Orijinalini göster')}</summary>
          {entry.original_question && <p className="my-1">{t('S:')} <Localized value={entry.original_question} /></p>}
          {entry.original_answer && <p className="my-1">{t('C:')} <Localized value={entry.original_answer} /></p>}
        </details>
      )}
    </article>
  );
}
