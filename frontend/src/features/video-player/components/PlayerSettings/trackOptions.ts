import type { VideoLanguageTrack } from '../../../../api';
import type { SearchOption } from '../../../../components/SearchSelect';
import type { Translate } from '../../../../i18n';
import type { TrackKind } from '../../hooks/useVideoPlayer';

export const OFF = 'off';

/** One menu entry per language: its own name, "(orijinal)" for the original audio, and whether it is ready,
 * being prepared (not selectable) or will be prepared when picked ("iste"). */
export function trackOption(track: VideoLanguageTrack, kind: TrackKind, t: Translate): SearchOption {
  const status = track[kind];
  const name = track.is_original && kind === 'audio' ? `${track.language_name} (${t('orijinal')})` : track.language_name;
  const base = { value: track.language, hint: track.language_tr_name, lang: track.language };
  if (status === 'ready') return { ...base, label: name };
  if (status === 'preparing') return { ...base, label: `${name} · ${t('hazırlanıyor')}`, disabled: true };
  return { ...base, label: `${name} · ${t('iste')}` };
}

/** Subtitles: "Kapalı" + every language. Audio: languages with a voice only (the rest get subtitles only). */
export function menuOptions(tracks: VideoLanguageTrack[], kind: TrackKind, t: Translate): SearchOption[] {
  if (kind === 'subtitles') return [{ value: OFF, label: t('Kapalı') }, ...tracks.map((x) => trackOption(x, kind, t))];
  return tracks.filter((x) => x.audio !== 'unavailable').map((x) => trackOption(x, kind, t));
}
