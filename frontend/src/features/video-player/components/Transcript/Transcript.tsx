import { ChevronDown, ScrollText } from 'lucide-react';
import { useState } from 'react';
import type { TranscriptSegment } from '../../../../api';
import { Card } from '../../../../components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../../components/ui/collapsible';
import { formatDuration } from '../../../../lib/format';
import { useT } from '../../../../i18n';

interface Props {
  segments: TranscriptSegment[];
  lang: string;
  dir: 'ltr' | 'rtl';
  currentSec: number;
  onSeek: (sec: number) => void;
}

/** The usta's words as timed text under the player, folded by default: the header shows what is being said now;
 * opened, every line is listed and a tap jumps the video there. */
export function Transcript({ segments, lang, dir, currentSec, onSeek }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (segments.length === 0) return null;
  const isNow = (s: TranscriptSegment) => currentSec >= s.start_sec && currentSec < s.end_sec;
  const now = segments.find(isNow) ?? segments[0];
  return (
    <Card asChild className="gap-0 overflow-hidden p-0">
      <section aria-label={t('Ustanın anlatımı (otomatik metin)')}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="group flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-steel" aria-hidden="true">
              <ScrollText className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold">{t('Ustanın anlatımı')}</span>
              <span className="text-xs text-muted-foreground">{t('Otomatik metin')} · {segments.length} {t('satır')}</span>
              {!open && now && (
                <span className="mt-1.5 truncate text-sm text-foreground/80" lang={lang} dir={dir}>
                  <b className="me-1.5 font-mono text-xs font-semibold text-steel">{formatDuration(now.start_sec)}</b>
                  {now.text}
                </span>
              )}
            </span>
            <span className="hidden text-xs font-semibold text-steel sm:inline">{open ? t('Gizle') : t('Göster')}</span>
            <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1">
            <ol className="m-0 flex max-h-80 list-none flex-col gap-0.5 overflow-y-auto p-2">
              {segments.map((s) => (
                <li key={s.start_sec}>
                  <button
                    type="button"
                    aria-current={isNow(s) || undefined}
                    onClick={() => onSeek(s.start_sec)}
                    className="grid w-full grid-cols-[48px_1fr] gap-2 rounded-md border-s-2 border-transparent px-2 py-1.5 text-start text-sm transition-colors hover:bg-muted aria-current:border-primary aria-current:bg-accent"
                  >
                    <span className="pt-0.5 font-mono text-xs text-muted-foreground">{formatDuration(s.start_sec)}</span>
                    <span lang={lang} dir={dir}>{s.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </section>
    </Card>
  );
}
