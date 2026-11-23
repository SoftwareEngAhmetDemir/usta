import { Link, useParams, useSearchParams } from 'react-router';
import type { DocumentDetail } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { PageTitle } from '../../components/PageTitle';
import { Card } from '../../components/ui/card';
import { DOCUMENT_TYPE_LABEL } from '../../lib/labels';
import { DocumentViewer } from './components/DocumentViewer';
import { SummaryCard } from './components/SummaryCard';
import { useT } from '../../i18n';

const POLL_MS = 5000;

/** Document + AI summary; `?page=37` opens the PDF at that page. */
export function DocumentPage() {
  const t = useT();
  const { documentId = '' } = useParams();
  const page = Math.max(1, Number(useSearchParams()[0].get('page') ?? 1) || 1);
  const { state, reload } = useApi<DocumentDetail>(`/documents/${documentId}`, (d) =>
    d.summary_status === 'preparing' ? POLL_MS : undefined,
  );

  return (
    <>
      <PageTitle title={t('Doküman')} back />
      <AsyncView state={state} onRetry={reload}>
        {(doc) => (
          <>
            <Card className="gap-1">
              <div className="text-lg leading-tight font-semibold">{doc.title}</div>
              <div className="text-sm text-muted-foreground">
                {t(DOCUMENT_TYPE_LABEL[doc.type])} · {doc.page_count} {t('sayfa ·')} <Link className="font-medium text-steel underline-offset-2 hover:underline" to={`/m/${doc.machine_id}`}>{doc.machine_name}</Link>
              </div>
            </Card>
            <SummaryCard status={doc.summary_status} summary={doc.summary} />
            <DocumentViewer doc={doc} page={page} />
          </>
        )}
      </AsyncView>
    </>
  );
}
