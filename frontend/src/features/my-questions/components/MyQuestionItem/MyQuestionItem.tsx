import { Link } from 'react-router';
import type { MyQuestion } from '../../../../api';
import { Localized } from '../../../../components/Localized';
import { Pill } from '../../../../components/Pill';
import { formatDate } from '../../../../lib/format';
import { useT } from '../../../../i18n';

export function MyQuestionItem({ item }: { item: MyQuestion }) {
  const t = useT();
  return (
    <article className="list-item" style={{ display: 'block' }}>
      <div className="row">
        <span className="strong grow"><Localized value={item.question} /></span>
        {item.status === 'open' ? <Pill tone="warn">{t('Açık')}</Pill> : <Pill tone="ok">{t('Cevaplandı')}</Pill>}
      </div>
      {item.answer && <div>{t('C:')}{' '}<Localized value={item.answer} /></div>}
      <div className="row wrap" style={{ marginTop: 4 }}>
        {item.answer_video_id !== null && <Link className="chip" to={`/videos/${item.answer_video_id}`}>{t('▶ Cevap videosu')}</Link>}
        {item.answer_file_url && <a className="chip" href={item.answer_file_url} target="_blank" rel="noreferrer">{t('📎 Ek dosya')}</a>}
      </div>
      <div className="muted">
        <Link to={`/m/${item.machine_id}`}>{item.machine_name}</Link> · {formatDate(item.created_at)}
        {item.usta && <> · {item.usta.name}</>}
      </div>
    </article>
  );
}
