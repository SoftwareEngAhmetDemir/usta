import type { QaEntry } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { QaCard } from '../../../../components/QaCard';
import { SectionTitle } from '../../../../components/SectionTitle';
import { useT } from '../../../../i18n';

export function QaSection({ questions }: { questions: QaEntry[] }) {
  const t = useT();
  return (
    <section aria-labelledby="qa-title" className="stack">
      <SectionTitle id="qa-title" title={t('Sorular & cevaplar')} extra={questions.length} />
      <div className="card">
        {questions.length === 0 ? <EmptyState message={t('Henüz soru yok.')} /> : questions.map((q) => <QaCard key={q.id} entry={q} />)}
      </div>
    </section>
  );
}
