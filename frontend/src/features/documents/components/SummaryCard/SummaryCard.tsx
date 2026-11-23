import { Sparkles } from 'lucide-react';
import type { DocumentDetail } from '../../../../api';
import { Notice } from '../../../../components/Notice';
import { useT } from '../../../../i18n';

/** AI summary in the worker's language (KAN-45); Arabic renders right-to-left. */
export function SummaryCard({ status, summary }: Pick<DocumentDetail, 'summary'> & { status: DocumentDetail['summary_status'] }) {
  const t = useT();
  if (status === 'preparing') return <Notice tone="waiting" title={t('Özet sizin dilinizde hazırlanıyor…')} />;
  if (!summary) return <p className="m-0 text-sm text-muted-foreground">{t('Bu doküman için özet yok.')}</p>;
  return (
    <section className="rounded-e-xl border-s-4 border-steel bg-secondary/60 px-4 py-3" lang={summary.lang} dir={summary.dir} aria-label={t('AI özet')}>
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-steel uppercase" dir="ltr" lang="tr">
        <Sparkles className="size-3.5" aria-hidden="true" />{t('AI özet ·')} {summary.language_name}
      </div>
      <ul className="m-0 mt-2 list-disc space-y-1 ps-5">{summary.points.map((p) => <li key={p}>{p}</li>)}</ul>
    </section>
  );
}
