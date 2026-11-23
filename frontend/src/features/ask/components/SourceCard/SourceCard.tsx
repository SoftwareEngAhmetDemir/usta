import { FileText, Play, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { AnswerSource } from '../../../../api';
import { formatDate } from '../../../../lib/format';
import { useT } from '../../../../i18n';

const box = 'flex w-full items-center gap-3 rounded-lg border bg-background p-2 text-start text-inherit no-underline';
const icon = 'grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-steel text-white [&_svg]:size-5';
const where = 'font-mono text-xs font-semibold text-steel';

function Body({ title, children }: { title: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate font-semibold">{title}</span>
      <span className="text-xs">{children}</span>
    </span>
  );
}

/** Video source opens the player at that second (with a keyframe of that part); document source opens the file
 * at that page (KAN-61). Labels come from the backend. */
export function SourceCard({ source }: { source: AnswerSource }) {
  const t = useT();
  switch (source.kind) {
    case 'video':
      return (
        <Link className={`${box} transition-colors hover:bg-muted/60`} to={`/videos/${source.video_id}?t=${source.start_sec}`}>
          <span className={icon} aria-hidden="true">
            {source.snapshot_urls[0] ? <img className="size-full object-cover" src={source.snapshot_urls[0]} alt="" /> : <Play />}
          </span>
          <Body title={source.title}>
            <span className={where}>{t('VİDEO ·')} {source.timestamp_label}</span> <span className="text-muted-foreground">· {source.usta_name}</span>
          </Body>
        </Link>
      );
    case 'document':
      return (
        <Link className={`${box} transition-colors hover:bg-muted/60`} to={`/documents/${source.document_id}?page=${source.page}`}>
          <span className={icon} aria-hidden="true"><FileText /></span>
          <Body title={source.title}>
            <span className={where}>{t('SAYFA')} {source.page}</span>
            {source.section_heading && <span className="text-muted-foreground"> · {source.section_heading}</span>}
          </Body>
        </Link>
      );
    case 'usta_answer':
      return (
        <div className={box}>
          <span className={icon} aria-hidden="true"><UserRound /></span>
          <Body title={t('Ustanın önceki cevabı')}>
            <span className={where}>{source.usta_name} · {formatDate(source.answered_at)}</span>
          </Body>
        </div>
      );
  }
}
