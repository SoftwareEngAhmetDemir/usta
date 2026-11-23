import { Link, useParams } from 'react-router';
import { AsyncView } from '../../components/AsyncView';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Localized } from '../../components/Localized';
import { PageTitle } from '../../components/PageTitle';
import { ProgressBar } from '../../components/ProgressBar';
import { SearchSelect } from '../../components/SearchSelect';
import { languageOption } from '../language';
import { ReplyForm } from './components/ReplyForm';
import { useQuestionIn } from './hooks/useQuestionIn';
import { useReply } from './hooks/useReply';
import { useT } from '../../i18n';

/** Reply screen opened from the alert: question, machine and worker (KAN-63). */
export function ReplyPage() {
  const t = useT();
  const questionId = Number(useParams().questionId);
  const { state, reload, lang, setLang, languages } = useQuestionIn(questionId);
  const reply = useReply(questionId);

  return (
    <>
      <PageTitle title={t('Soruyu cevapla')} back />
      <AsyncView state={state} onRetry={reload}>
        {(q) => (
          <div className="card">
            <div className="label">{t('Soru ·')}{' '}<Link to={`/m/${q.machine_id}`}>{q.machine_name}</Link></div>
            <p className="strong" style={{ margin: '6px 0 0' }}><Localized value={q.question} /></p>
            {q.original_question && <p className="muted" style={{ margin: '4px 0' }}>{t('Orijinali:')}{' '}<Localized value={q.original_question} /></p>}
            <div className="muted">{q.worker_name}{' '}{t('· işçinin dili:')}{' '}{q.worker_language_name}{' '}{t('(cevabın çevrilecek)')}</div>
            {languages.length > 0 && (
              <SearchSelect
                id="question-language"
                label={t('Soruyu şu dilde göster')}
                value={lang}
                options={languages.map(languageOption)}
                onChange={setLang}
              />
            )}
          </div>
        )}
      </AsyncView>
      {reply.state.status === 'sent' ? (
        <output className="card stack">
          <span className="pill ok">{t('Gönderildi')}</span>
          <span>{t('Cevap işçiye iletildi, makineye ve profiline kaydedildi.')}</span>
          <Link className="btn" data-variant="secondary" to="/usta">{t('Sorulara dön')}</Link>
        </output>
      ) : (
        <>
          {reply.state.status === 'sending' && <ProgressBar fraction={reply.state.progress} label={t('Gönderiliyor')} />}
          {reply.state.status === 'error' && <ErrorMessage error={reply.state.error} />}
          <ReplyForm sending={reply.state.status === 'sending'} onSend={reply.send} />
        </>
      )}
    </>
  );
}
