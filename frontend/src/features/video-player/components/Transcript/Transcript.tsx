import type { TranscriptSegment } from '../../../../api';
import { formatDuration } from '../../../../lib/format';

interface Props {
  segments: TranscriptSegment[];
  lang: string;
  dir: 'ltr' | 'rtl';
  currentSec: number;
  onSeek: (sec: number) => void;
}

/** The usta's words as timed text under the player; tap a line to jump there. */
export function Transcript({ segments, lang, dir, currentSec, onSeek }: Props) {
  if (segments.length === 0) return null;
  return (
    <section className="card">
      <div className="label">Ustanın anlatımı (otomatik metin)</div>
      <div className="seglist" style={{ marginTop: 6 }}>
        {segments.map((s) => {
          const on = currentSec >= s.start_sec && currentSec < s.end_sec;
          return (
            <button key={s.start_sec} type="button" className={on ? 'seg on' : 'seg'} aria-current={on || undefined} onClick={() => onSeek(s.start_sec)}>
              <span className="ts">{formatDuration(s.start_sec)}</span>
              <span lang={lang} dir={dir}>{s.text}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
