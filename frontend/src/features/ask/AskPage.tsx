import { Link, useParams } from 'react-router';
import type { MachinePage } from '../../api';
import { useApi } from '../../api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageTitle } from '../../components/PageTitle';
import { AnswerCard } from './components/AnswerCard';
import { AskForm } from './components/AskForm';
import { NotFoundCard } from './components/NotFoundCard';
import { useAsk } from './hooks/useAsk';
import { useT } from '../../i18n';

/** "Makineye sor": answers in the worker's language with jump-to-source (KAN-61). */
export function AskPage() {
  const t = useT();
  const { machineId = '' } = useParams();
  const { state } = useApi<MachinePage>(`/machines/${machineId}`);
  const { items, ask, sendToUsta, busy } = useAsk(machineId);
  const name = state.status === 'ok' ? state.data.machine.name : '';

  return (
    <>
      <PageTitle title={t('Makineye sor')} back />
      <div className="card">
        <div className="strong">{name}</div>
        <div className="muted">{t('Bu makinenin videoları, dokümanları ve ustaların önceki cevapları içinde aranır. Cevap sizin dilinizde gelir.')}</div>
      </div>
      <AskForm onAsk={ask} busy={busy} />
      {items.map((x, i) => (
        <div key={i} className="stack">
          <div className="bubble-q">{x.question}</div>
          {x.result === null && x.error === null && <output className="card muted">{t('Videolarda ve dokümanlarda aranıyor…')}</output>}
          {x.result?.status === 'answered' && <AnswerCard answer={x.result.answer} sources={x.result.sources} askId={x.result.ask_id} />}
          {x.result?.status === 'not_found' && (
            <NotFoundCard question={x.question} ustas={x.result.ustas} sent={x.sent} sending={x.sending} onSend={(q) => sendToUsta(i, q)} />
          )}
          <ErrorMessage error={x.error} />
        </div>
      ))}
      {items.some((x) => x.sent) && <Link to="/my-questions">{t('Sorularım →')}</Link>}
    </>
  );
}
