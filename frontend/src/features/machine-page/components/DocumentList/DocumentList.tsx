import { FileText, Sparkles, Upload } from 'lucide-react';
import { Link } from 'react-router';
import type { DocumentSummary } from '../../../../api';
import { Button } from '../../../../components/Button';
import { EmptyState } from '../../../../components/EmptyState';
import { ListItem } from '../../../../components/ListItem';
import { Localized } from '../../../../components/Localized';
import { Pill } from '../../../../components/Pill';
import { SectionTitle } from '../../../../components/SectionTitle';
import { Thumb } from '../../../../components/Thumb';
import { Card } from '../../../../components/ui/card';
import { DOCUMENT_TYPE_LABEL } from '../../../../lib/labels';
import { useT } from '../../../../i18n';

interface Props {
  machineId: number;
  documents: DocumentSummary[]; // grouped by type by the backend
  canUpload: boolean;
}

export function DocumentList({ machineId, documents, canUpload }: Props) {
  const t = useT();
  const upload = canUpload ? (
    <Button asChild size="small" variant="secondary"><Link to={`/m/${machineId}/documents/new`}><Upload aria-hidden="true" />{t('Belge yükle')}</Link></Button>
  ) : undefined;
  return (
    <section aria-labelledby="docs-title" className="flex flex-col gap-2">
      <SectionTitle id="docs-title" title={t('Dokümanlar')} extra={documents.length} />
      {documents.length === 0 ? <EmptyState message={t('Henüz doküman yok.')} action={upload} /> : (
        <Card className="gap-0">
          {documents.map((d) => (
            <ListItem key={d.id} asChild className="items-start">
              <Link to={`/documents/${d.id}`}>
                <Thumb kind="doc"><FileText /></Thumb>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-semibold">{d.title}</span>
                  <span className="text-sm text-muted-foreground">{t(DOCUMENT_TYPE_LABEL[d.type])} · {d.page_count} {t('sayfa')}</span>
                  {d.summary_status === 'preparing' && <Pill tone="warn">{t('Özet hazırlanıyor')}</Pill>}
                  {d.summary_preview && (
                    <span className="mt-1 block rounded-e-lg border-s-4 border-steel bg-secondary/60 px-3 py-2 text-sm">
                      <span className="flex items-center gap-1 text-xs font-semibold tracking-wide text-steel uppercase"><Sparkles className="size-3.5" aria-hidden="true" />{t('AI özet')}</span>
                      <Localized value={d.summary_preview} />
                    </span>
                  )}
                </span>
              </Link>
            </ListItem>
          ))}
        </Card>
      )}
      {documents.length > 0 && upload && <div>{upload}</div>}
    </section>
  );
}
