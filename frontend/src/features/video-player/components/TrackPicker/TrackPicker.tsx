import type { LanguageCode, VideoLanguageTrack } from '../../../../api';
import { SearchSelect } from '../../../../components/SearchSelect';
import type { SearchOption } from '../../../../components/SearchSelect';
import type { TrackKind as Kind } from '../../hooks/useVideoPlayer';
import { useT } from '../../../../i18n';
import type { Translate } from '../../../../i18n';

interface Props {
  tracks: VideoLanguageTrack[];
  audio: LanguageCode | null;
  subtitle: LanguageCode | null;
  onAudio: (lang: LanguageCode) => void;
  onSubtitle: (lang: LanguageCode | 'off') => void;
  onRequest: (lang: LanguageCode, kind: Kind) => void;
}

const OFF = 'off';

function option(track: VideoLanguageTrack, kind: Kind, t: Translate): SearchOption {
  const status = track[kind];
  const name = track.is_original && kind === 'audio' ? `${track.language_name} (${t('orijinal')})` : track.language_name;
  const base = { value: track.language, hint: track.language_tr_name, lang: track.language };
  if (status === 'ready') return { ...base, label: name };
  if (status === 'preparing') return { ...base, label: `${name} · ${t('hazırlanıyor')}`, disabled: true };
  return { ...base, label: `${name} · ${t('iste')}` };
}

/** Subtitle and audio language drop-downs with search; picking a language that isn't ready requests it (KAN-50, KAN-55, KAN-56).
 * Languages without a dubbed voice are left out of the audio list (subtitles only). */
export function TrackPicker({ tracks, audio, subtitle, onAudio, onSubtitle, onRequest }: Props) {
  const t = useT();
  function pick(kind: Kind, lang: LanguageCode, choose: (lang: LanguageCode) => void) {
    const track = tracks.find((x) => x.language === lang);
    if (track && track[kind] !== 'ready') onRequest(lang, kind);
    else choose(lang);
  }
  const voiced = tracks.filter((x) => x.audio !== 'unavailable');
  return (
    <div className="card stack">
      <SearchSelect
        id="subtitle-language"
        label={t('Altyazı')}
        value={subtitle ?? OFF}
        options={[{ value: OFF, label: t('Kapalı') }, ...tracks.map((x) => option(x, 'subtitles', t))]}
        onChange={(v) => (v === OFF ? onSubtitle(OFF) : pick('subtitles', v, onSubtitle))}
      />
      <SearchSelect
        id="audio-language"
        label={t('Ses')}
        value={audio ?? ''}
        options={voiced.map((x) => option(x, 'audio', t))}
        onChange={(v) => pick('audio', v, onAudio)}
      />
    </div>
  );
}
