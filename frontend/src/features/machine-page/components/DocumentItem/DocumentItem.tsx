import { FileText, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import type { DocumentSummary } from '../../../../api';
import { ListItem } from '../../../../components/ListItem';
import { Localized } from '../../../../components/Localized';
import { Pill } from '../../../../components/Pill';
import { Thumb } from '../../../../components/Thumb';
import { DOCUMENT_TYPE_LABEL } from '../../../../lib/labels';
import { useT } from '../../../../i18n';
import { TrashButton } from '../TrashButton';

interface Props {
  document: DocumentSummary;
  onDelete?: () => void; // given to the patron: a trash button at the end of the row
}

/** One document row: opens the document; with its type, pages and the start of its AI summary. */
export function DocumentItem({ document: d, onDelete }: Props) {
  const t = useT();
  const body = (
    <>
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
    </>
  );
  // While it is still being read (summary preparing) the backend refuses a delete (409).
  if (!onDelete || d.summary_status === 'preparing') return <ListItem asChild className="items-start"><Link to={`/documents/${d.id}`}>{body}</Link></ListItem>;
  return (
    <ListItem className="items-start">
      <Link to={`/documents/${d.id}`} className="flex min-w-0 flex-1 items-start gap-3 text-inherit no-underline">{body}</Link>
      <TrashButton label={`${t('Sil')}: ${d.title}`} onClick={onDelete} />
    </ListItem>
  );
}
