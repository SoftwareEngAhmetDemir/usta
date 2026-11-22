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

/** Reply screen opened from the alert: question, machine and worker (KAN-63). */
export function ReplyPage() {
  const questionId = Number(useParams().questionId);
  const { state, reload, lang, setLang, languages } = useQuestionIn(questionId);
  const reply = useReply(questionId);

  return (
    <>
      <PageTitle title="Soruyu cevapla" back />
      <AsyncView state={state} onRetry={reload}>
        {(q) => (
          <div className="card">
            <div className="label">Soru · <Link to={`/m/${q.machine_id}`}>{q.machine_name}</Link></div>
            <p className="strong" style={{ margin: '6px 0 0' }}><Localized value={q.question} /></p>
            {q.original_question && <p className="muted" style={{ margin: '4px 0' }}>Orijinali: <Localized value={q.original_question} /></p>}
            <div className="muted">{q.worker_name} · işçinin dili: {q.worker_language_name} (cevabın çevrilecek)</div>
            {languages.length > 0 && (
              <SearchSelect
                id="question-language"
                label="Soruyu şu dilde göster"
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
          <span className="pill ok">Gönderildi</span>
          <span>Cevap işçiye iletildi, makineye ve profiline kaydedildi.</span>
          <Link className="btn" data-variant="secondary" to="/usta">Sorulara dön</Link>
        </output>
      ) : (
        <>
          {reply.state.status === 'sending' && <ProgressBar fraction={reply.state.progress} label="Gönderiliyor" />}
          {reply.state.status === 'error' && <ErrorMessage error={reply.state.error} />}
          <ReplyForm sending={reply.state.status === 'sending'} onSend={reply.send} />
        </>
      )}
    </>
  );
}
