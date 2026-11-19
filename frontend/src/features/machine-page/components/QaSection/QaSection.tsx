import type { QaEntry } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { QaCard } from '../../../../components/QaCard';
import { SectionTitle } from '../../../../components/SectionTitle';

export function QaSection({ questions }: { questions: QaEntry[] }) {
  return (
    <section aria-labelledby="qa-title" className="stack">
      <SectionTitle id="qa-title" title="Sorular & cevaplar" extra={questions.length} />
      <div className="card">
        {questions.length === 0 ? <EmptyState message="Henüz soru yok." /> : questions.map((q) => <QaCard key={q.id} entry={q} />)}
      </div>
    </section>
  );
}
