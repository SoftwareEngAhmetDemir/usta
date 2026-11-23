import { Loader2, Search } from 'lucide-react';
import { Link, useParams } from 'react-router';
import type { MachinePage } from '../../api';
import { useApi } from '../../api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageTitle } from '../../components/PageTitle';
import { Card } from '../../components/ui/card';
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
      <Card className="flex-row items-start gap-3 bg-secondary/50">
        <Search className="mt-0.5 size-5 shrink-0 text-steel" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-muted-foreground">{t('Bu makinenin videoları, dokümanları ve ustaların önceki cevapları içinde aranır. Cevap sizin dilinizde gelir.')}</div>
        </div>
      </Card>
      <AskForm onAsk={ask} busy={busy} />
      {items.map((x, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="max-w-[85%] self-end rounded-2xl rounded-ee-sm bg-steel px-3.5 py-2.5 text-steel-foreground shadow-sm">{x.question}</div>
          {x.result === null && x.error === null && (
            <output className="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t('Videolarda ve dokümanlarda aranıyor…')}
            </output>
          )}
          {x.result?.status === 'answered' && <AnswerCard answer={x.result.answer} sources={x.result.sources} askId={x.result.ask_id} />}
          {x.result?.status === 'not_found' && (
            <NotFoundCard question={x.question} ustas={x.result.ustas} sent={x.sent} sending={x.sending} onSend={(q) => sendToUsta(i, q)} />
          )}
          <ErrorMessage error={x.error} />
        </div>
      ))}
      {items.some((x) => x.sent) && (
        <Link to="/my-questions" className="inline-flex items-center gap-1 self-start font-semibold text-steel underline-offset-4 hover:underline">
          {t('Sorularım →')}
        </Link>
      )}
    </>
  );
}
