import { Link } from 'react-router';
import type { DocumentSummary } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { Localized } from '../../../../components/Localized';
import { SectionTitle } from '../../../../components/SectionTitle';
import { DOCUMENT_TYPE_LABEL } from '../../../../lib/labels';
import { useT } from '../../../../i18n';

interface Props {
  machineId: number;
  documents: DocumentSummary[]; // grouped by type by the backend
  canUpload: boolean;
}

export function DocumentList({ machineId, documents, canUpload }: Props) {
  const t = useT();
  const upload = canUpload ? <Link className="btn" data-size="small" to={`/m/${machineId}/documents/new`}>{t('Belge yükle')}</Link> : undefined;
  return (
    <section aria-labelledby="docs-title" className="stack">
      <SectionTitle id="docs-title" title={t('Dokümanlar')} extra={documents.length} />
      <div className="card">
        {documents.length === 0 && <EmptyState message={t('Henüz doküman yok.')} action={upload} />}
        {documents.map((d) => (
          <Link key={d.id} className="list-item" to={`/documents/${d.id}`}>
            <span className="thumb doc" aria-hidden="true">{t('PDF')}</span>
            <span className="grow">
              <span className="strong">{d.title}</span>
              <br />
              <span className="muted">{t(DOCUMENT_TYPE_LABEL[d.type])} · {d.page_count}{' '}{t('sayfa')}</span>
              {d.summary_status === 'preparing' && <><br /><span className="pill warn">{t('Özet hazırlanıyor')}</span></>}
              {d.summary_preview && (
                <span className="summary" style={{ display: 'block', marginTop: 6 }}>
                  <span className="label">{t('AI özet')}</span><br />
                  <Localized value={d.summary_preview} />
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
      {documents.length > 0 && upload}
    </section>
  );
}
