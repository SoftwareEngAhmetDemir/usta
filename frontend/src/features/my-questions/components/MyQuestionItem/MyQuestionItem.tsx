import { Paperclip, Play } from 'lucide-react';
import { Link } from 'react-router';
import type { MyQuestion } from '../../../../api';
import { Chip } from '../../../../components/Chip';
import { Localized } from '../../../../components/Localized';
import { Pill } from '../../../../components/Pill';
import { formatDate } from '../../../../lib/format';
import { useT } from '../../../../i18n';

export function MyQuestionItem({ item }: { item: MyQuestion }) {
  const t = useT();
  return (
    <article className="flex flex-col gap-1.5 border-t py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 font-semibold"><Localized value={item.question} /></span>
        {item.status === 'open' ? <Pill tone="warn">{t('Açık')}</Pill> : <Pill tone="ok">{t('Cevaplandı')}</Pill>}
      </div>
      {item.answer && <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm">{t('C:')} <Localized value={item.answer} /></div>}
      {(item.answer_video_id !== null || item.answer_file_url) && (
        <div className="flex flex-wrap gap-2">
          {item.answer_video_id !== null && <Chip asChild><Link to={`/videos/${item.answer_video_id}`}><Play aria-hidden="true" />{t('Cevap videosu')}</Link></Chip>}
          {item.answer_file_url && <Chip asChild><a href={item.answer_file_url} target="_blank" rel="noreferrer"><Paperclip aria-hidden="true" />{t('Ek dosya')}</a></Chip>}
        </div>
      )}
      <div className="text-sm text-muted-foreground">
        <Link className="text-steel underline-offset-2 hover:underline" to={`/m/${item.machine_id}`}>{item.machine_name}</Link> · {formatDate(item.created_at)}
        {item.usta && <> · {item.usta.name}</>}
      </div>
    </article>
  );
}
