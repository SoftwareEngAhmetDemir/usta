import { MessageCircleQuestion, Send } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '../../components/Button';
import { Pill } from '../../components/Pill';
import { Card } from '../../components/ui/card';
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
          <Card className="border-s-4 border-s-primary">
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <MessageCircleQuestion className="size-4" aria-hidden="true" />{t('Soru ·')} <Link className="text-steel normal-case underline-offset-2 hover:underline" to={`/m/${q.machine_id}`}>{q.machine_name}</Link>
            </div>
            <p className="m-0 text-lg leading-snug font-semibold"><Localized value={q.question} /></p>
            {q.original_question && <p className="m-0 text-sm text-muted-foreground">{t('Orijinali:')} <Localized value={q.original_question} /></p>}
            <div className="text-sm text-muted-foreground">{q.worker_name} {t('· işçinin dili:')} {q.worker_language_name} {t('(cevabın çevrilecek)')}</div>
            {languages.length > 0 && (
              <SearchSelect
                id="question-language"
                label={t('Soruyu şu dilde göster')}
                value={lang}
                options={languages.map(languageOption)}
                onChange={setLang}
              />
            )}
          </Card>
        )}
      </AsyncView>
      {reply.state.status === 'sent' ? (
        <output className="flex flex-col items-start gap-3 rounded-xl border border-success/30 bg-success/8 p-4">
          <Pill tone="ok"><Send aria-hidden="true" />{t('Gönderildi')}</Pill>
          <span>{t('Cevap işçiye iletildi, makineye ve profiline kaydedildi.')}</span>
          <Button asChild variant="secondary"><Link to="/usta">{t('Sorulara dön')}</Link></Button>
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
