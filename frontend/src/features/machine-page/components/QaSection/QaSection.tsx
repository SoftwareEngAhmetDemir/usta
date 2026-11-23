import type { QaEntry } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { QaCard } from '../../../../components/QaCard';
import { SectionTitle } from '../../../../components/SectionTitle';
import { Card } from '../../../../components/ui/card';
import { useT } from '../../../../i18n';

export function QaSection({ questions }: { questions: QaEntry[] }) {
  const t = useT();
  return (
    <section aria-labelledby="qa-title" className="flex flex-col gap-2">
      <SectionTitle id="qa-title" title={t('Sorular & cevaplar')} extra={questions.length} />
      {questions.length === 0 ? <EmptyState message={t('Henüz soru yok.')} /> : <Card className="gap-0">{questions.map((q) => <QaCard key={q.id} entry={q} />)}</Card>}
    </section>
  );
}
