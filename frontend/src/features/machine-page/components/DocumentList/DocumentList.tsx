import { Upload } from 'lucide-react';
import { Link } from 'react-router';
import type { DocumentSummary } from '../../../../api';
import { Button } from '../../../../components/Button';
import { EmptyState } from '../../../../components/EmptyState';
import { SectionTitle } from '../../../../components/SectionTitle';
import { Card } from '../../../../components/ui/card';
import { useT } from '../../../../i18n';
import { DocumentItem } from '../DocumentItem';

interface Props {
  machineId: number;
  documents: DocumentSummary[]; // grouped by type by the backend
  canUpload: boolean;
  onDelete?: (document: DocumentSummary) => void; // the patron's trash button
}

export function DocumentList({ machineId, documents, canUpload, onDelete }: Props) {
  const t = useT();
  const upload = canUpload ? (
    <Button asChild size="small" variant="secondary"><Link to={`/m/${machineId}/documents/new`}><Upload aria-hidden="true" />{t('Belge yükle')}</Link></Button>
  ) : undefined;
  return (
    <section aria-labelledby="docs-title" className="flex flex-col gap-2">
      <SectionTitle id="docs-title" title={t('Dokümanlar')} extra={documents.length} />
      {documents.length === 0 ? <EmptyState message={t('Henüz doküman yok.')} action={upload} /> : (
        <Card className="gap-0">
          {documents.map((d) => <DocumentItem key={d.id} document={d} onDelete={onDelete && (() => onDelete(d))} />)}
        </Card>
      )}
      {documents.length > 0 && upload && <div>{upload}</div>}
    </section>
  );
}
