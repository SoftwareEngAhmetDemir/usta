import { Download, Maximize2 } from 'lucide-react';
import type { DocumentDetail } from '../../../../api';
import { Button } from '../../../../components/Button';
import { useT } from '../../../../i18n';

/** Opens the file on the phone without extra apps; PDFs open at `page` (jump from an answer source). */
export function DocumentViewer({ doc, page }: { doc: DocumentDetail; page: number }) {
  const t = useT();
  const isPdf = doc.mime_type === 'application/pdf';
  const isImage = doc.mime_type.startsWith('image/');
  const src = isPdf ? `${doc.file_url}#page=${page}` : doc.file_url;
  return (
    <section className="flex flex-col gap-3">
      {isPdf && <iframe className="h-[70dvh] w-full rounded-xl border bg-white" src={src} title={`${doc.title}, ${t('sayfa')} ${page}`} />}
      {isImage && <img className="w-full rounded-xl border" src={doc.file_url} alt={doc.title} />}
      {!isPdf && !isImage && <p className="m-0 text-sm text-muted-foreground">{t('Bu dosya türü telefonda önizlenemiyor; indirip açabilirsiniz.')}</p>}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="small"><a href={src} target="_blank" rel="noreferrer"><Maximize2 aria-hidden="true" />{t('Tam ekran aç')}</a></Button>
        <Button asChild variant="secondary" size="small"><a href={doc.file_url} download><Download aria-hidden="true" />{t('İndir')}</a></Button>
      </div>
    </section>
  );
}
