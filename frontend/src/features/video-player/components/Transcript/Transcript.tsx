import type { TranscriptSegment } from '../../../../api';
import { Card } from '../../../../components/ui/card';
import { formatDuration } from '../../../../lib/format';
import { useT } from '../../../../i18n';

interface Props {
  segments: TranscriptSegment[];
  lang: string;
  dir: 'ltr' | 'rtl';
  currentSec: number;
  onSeek: (sec: number) => void;
}

/** The usta's words as timed text under the player; tap a line to jump there. */
export function Transcript({ segments, lang, dir, currentSec, onSeek }: Props) {
  const t = useT();
  if (segments.length === 0) return null;
  return (
    <Card asChild className="gap-2"><section aria-label={t('Ustanın anlatımı (otomatik metin)')}>
      <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('Ustanın anlatımı (otomatik metin)')}</div>
      <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
        {segments.map((s) => {
          const on = currentSec >= s.start_sec && currentSec < s.end_sec;
          return (
            <button key={s.start_sec} type="button" aria-current={on || undefined} onClick={() => onSeek(s.start_sec)}
              className="grid grid-cols-[48px_1fr] gap-2 rounded-md p-1.5 text-start text-sm transition-colors hover:bg-muted aria-current:bg-accent">
              <span className="pt-0.5 font-mono text-xs text-muted-foreground">{formatDuration(s.start_sec)}</span>
              <span lang={lang} dir={dir}>{s.text}</span>
            </button>
          );
        })}
      </div>
    </section></Card>
  );
}
