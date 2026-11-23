import type { MyQuestion } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { EmptyState } from '../../components/EmptyState';
import { PageTitle } from '../../components/PageTitle';
import { Card } from '../../components/ui/card';
import { MyQuestionItem } from './components/MyQuestionItem';
import { useT } from '../../i18n';

/** "Sorularım": the worker's questions to ustas, open and answered (KAN-62). */
export function MyQuestionsPage() {
  const t = useT();
  const { state, reload } = useApi<MyQuestion[]>('/me/questions');
  return (
    <>
      <PageTitle title={t('Sorularım')} back />
      <AsyncView state={state} onRetry={reload}>
        {(items) =>
          items.length === 0 ? <EmptyState message={t('Henüz ustaya soru sormadınız.')} /> : (
            <Card className="gap-0">{items.map((q) => <MyQuestionItem key={q.id} item={q} />)}</Card>
          )
        }
      </AsyncView>
    </>
  );
}
