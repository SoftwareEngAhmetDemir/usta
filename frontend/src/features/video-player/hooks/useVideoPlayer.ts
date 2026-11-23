import { useEffect, useRef, useState } from 'react';
import type { LanguageCode, VideoDetail } from '../../../api';
import { useApi } from '../../../api';
import { requestLanguage, retryStep } from '../api';

const POLL_MS = 3000;
export type SubtitleChoice = LanguageCode | 'off';
export type TrackKind = 'audio' | 'subtitles';

/** Any language still being prepared (the viewer's own, or one picked from the menus). */
function preparing(v: VideoDetail): boolean {
  return v.preparation !== null || v.tracks.some((t) => t.subtitles === 'preparing' || t.audio === 'preparing');
}

/** Loads the video, follows the backend's default tracks (the site language) until the viewer picks one, polls
 * while preparing. The site language is asked for once if nobody has prepared it yet; a requested language is the
 * choice at once and plays as soon as it is ready (the original plays meanwhile). */
export function useVideoPlayer(videoId: number) {
  const { state, reload } = useApi<VideoDetail>(`/videos/${videoId}`, (v) => (preparing(v) ? POLL_MS : undefined));
  const [audioChoice, setAudioChoice] = useState<LanguageCode | null>(null);
  const [subChoice, setSubChoice] = useState<SubtitleChoice | null>(null);
  const [error, setError] = useState<unknown>(null);

  const video = state.status === 'ok' ? state.data : null;

  const audioLang = audioChoice ?? video?.default_audio_language ?? null;
  const audio = video?.tracks.find((t) => t.language === audioLang && t.stream_url)
    ?? video?.tracks.find((t) => t.is_original) ?? null;
  const subLang = subChoice ?? video?.default_subtitle_language ?? 'off';
  const subtitle = video?.tracks.find((t) => t.language === subLang && t.subtitle_url) ?? null;

  // The site language (the default) has never been asked for on this video: start it, once.
  const asked = useRef(false);
  const siteLang = video?.default_subtitle_language ?? null;
  const unprepared = video?.status === 'ready' && video.tracks.some((t) => t.language === siteLang && !t.is_original && t.subtitles === 'none');
  useEffect(() => {
    if (!unprepared || !siteLang || asked.current) return;
    asked.current = true;
    void run(() => requestLanguage(videoId, siteLang));
  });

  // CC button: off, or back on in the last language shown (else the site language, else the original).
  const lastSub = useRef<LanguageCode | null>(null);
  useEffect(() => { if (subLang !== 'off') lastSub.current = subLang; }, [subLang]);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      reload();
    } catch (e: unknown) {
      setError(e);
    }
  }

  function request(lang: LanguageCode, kind: TrackKind) {
    if (kind === 'audio') setAudioChoice(lang);
    else setSubChoice(lang);
    return run(() => requestLanguage(videoId, lang));
  }

  return {
    state,
    reload,
    audio,
    subtitle,
    audioLang, // what the menus show: the choice, even while it is still being prepared
    subLang,
    error,
    chooseAudio: setAudioChoice,
    chooseSubtitle: setSubChoice,
    request,
    toggleSubtitles: () => {
      if (subLang !== 'off') return setSubChoice('off');
      const lang = lastSub.current ?? siteLang ?? video?.tracks.find((t) => t.is_original)?.language;
      const track = video?.tracks.find((t) => t.language === lang);
      if (!lang || !track) return;
      if (track.subtitles === 'none' || track.subtitles === 'failed') return void request(lang, 'subtitles');
      setSubChoice(lang);
    },
    retry: (lang: LanguageCode, step: string) => run(() => retryStep(videoId, lang, step)),
  };
}
