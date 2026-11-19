import type { DocumentDetail } from '../../../../api';

/** AI summary in the worker's language (KAN-45); Arabic renders right-to-left. */
export function SummaryCard({ status, summary }: Pick<DocumentDetail, 'summary'> & { status: DocumentDetail['summary_status'] }) {
  if (status === 'preparing') return <div className="card warn">Özet sizin dilinizde hazırlanıyor…</div>;
  if (!summary) return <p className="muted" style={{ margin: 0 }}>Bu doküman için özet yok.</p>;
  return (
    <section className="summary" lang={summary.lang} dir={summary.dir} aria-label="AI özet">
      <div className="label" dir="ltr" lang="tr">AI özet · {summary.language_name}</div>
      <ul>{summary.points.map((p) => <li key={p}>{p}</li>)}</ul>
    </section>
  );
}
