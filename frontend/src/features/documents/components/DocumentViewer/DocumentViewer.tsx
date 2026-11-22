import type { DocumentDetail } from '../../../../api';

/** Opens the file on the phone without extra apps; PDFs open at `page` (jump from an answer source). */
export function DocumentViewer({ doc, page }: { doc: DocumentDetail; page: number }) {
  const isPdf = doc.mime_type === 'application/pdf';
  const isImage = doc.mime_type.startsWith('image/');
  const src = isPdf ? `${doc.file_url}#page=${page}` : doc.file_url;
  return (
    <section className="stack">
      {isPdf && <iframe className="pdf" src={src} title={`${doc.title}, sayfa ${page}`} />}
      {isImage && <img className="docimg" src={doc.file_url} alt={doc.title} />}
      {!isPdf && !isImage && <p className="muted">Bu dosya türü telefonda önizlenemiyor; indirip açabilirsiniz.</p>}
      <div className="row wrap">
        <a className="btn" data-variant="secondary" data-size="small" href={src} target="_blank" rel="noreferrer">Tam ekran aç</a>
        <a className="btn" data-variant="secondary" data-size="small" href={doc.file_url} download>İndir</a>
      </div>
    </section>
  );
}
