import type { LanguageCode, VideoLanguageTrack } from '../../../../api';

interface Props {
  tracks: VideoLanguageTrack[];
  audio: LanguageCode | null;
  subtitle: LanguageCode | null;
  onAudio: (lang: LanguageCode) => void;
  onSubtitle: (lang: LanguageCode | 'off') => void;
  onRequest: (lang: LanguageCode) => void;
}

function Chip({ track, kind, selected, onPick, onRequest }: { track: VideoLanguageTrack; kind: 'audio' | 'subtitles'; selected: boolean; onPick: () => void; onRequest: () => void }) {
  const status = track[kind];
  if (status === 'preparing') return <button type="button" className="chip" disabled>{track.language_name} · hazırlanıyor</button>;
  if (status !== 'ready') return <button type="button" className="chip" onClick={onRequest}>{track.language_name} · iste</button>;
  const name = track.is_original && kind === 'audio' ? `${track.language_name} (orijinal)` : track.language_name;
  return <button type="button" className="chip" aria-pressed={selected} onClick={onPick}>{name}</button>;
}

/** Subtitle and audio language menus; a missing language can be requested (KAN-50, KAN-55, KAN-56). */
export function TrackPicker({ tracks, audio, subtitle, onAudio, onSubtitle, onRequest }: Props) {
  return (
    <div className="card stack">
      <fieldset>
        <legend className="label">Altyazı</legend>
        <div className="chips">
          <button type="button" className="chip" aria-pressed={subtitle === null} onClick={() => onSubtitle('off')}>Kapalı</button>
          {tracks.map((t) => (
            <Chip key={t.language} track={t} kind="subtitles" selected={subtitle === t.language} onPick={() => onSubtitle(t.language)} onRequest={() => onRequest(t.language)} />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Ses</legend>
        <div className="chips">
          {tracks.map((t) => (
            <Chip key={t.language} track={t} kind="audio" selected={audio === t.language} onPick={() => onAudio(t.language)} onRequest={() => onRequest(t.language)} />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
