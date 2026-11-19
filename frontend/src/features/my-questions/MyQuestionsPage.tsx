import type { MyQuestion } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { EmptyState } from '../../components/EmptyState';
import { PageTitle } from '../../components/PageTitle';
import { MyQuestionItem } from './components/MyQuestionItem';

/** "Sorularım": the worker's questions to ustas, open and answered (KAN-62). */
export function MyQuestionsPage() {
  const { state, reload } = useApi<MyQuestion[]>('/me/questions');
  return (
    <>
      <PageTitle title="Sorularım" back />
      <AsyncView state={state} onRetry={reload}>
        {(items) => (
          <div className="card">
            {items.length === 0 ? <EmptyState message="Henüz ustaya soru sormadınız." /> : items.map((q) => <MyQuestionItem key={q.id} item={q} />)}
          </div>
        )}
      </AsyncView>
    </>
  );
}
