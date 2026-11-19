import { useState } from 'react';
import type { LanguageCode, VideoDetail } from '../../../api';
import { useApi } from '../../../api';
import { requestLanguage, retryStep } from '../api';

const POLL_MS = 3000;
export type SubtitleChoice = LanguageCode | 'off';

/** Loads the video, follows the backend's default tracks until the viewer picks one, polls while preparing. */
export function useVideoPlayer(videoId: number) {
  const { state, reload } = useApi<VideoDetail>(`/videos/${videoId}`, (v) => (v.preparation ? POLL_MS : undefined));
  const [audioChoice, setAudioChoice] = useState<LanguageCode | null>(null);
  const [subChoice, setSubChoice] = useState<SubtitleChoice | null>(null);
  const [error, setError] = useState<unknown>(null);

  const video = state.status === 'ok' ? state.data : null;

  const audio = video?.tracks.find((t) => t.language === (audioChoice ?? video.default_audio_language) && t.stream_url)
    ?? video?.tracks.find((t) => t.is_original) ?? null;
  const subLang = subChoice ?? video?.default_subtitle_language ?? 'off';
  const subtitle = video?.tracks.find((t) => t.language === subLang && t.subtitle_url) ?? null;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      reload();
    } catch (e: unknown) {
      setError(e);
    }
  }

  return {
    state,
    reload,
    audio,
    subtitle,
    error,
    chooseAudio: setAudioChoice,
    chooseSubtitle: setSubChoice,
    request: (lang: LanguageCode) => run(() => requestLanguage(videoId, lang)),
    retry: (lang: LanguageCode, step: string) => run(() => retryStep(videoId, lang, step)),
  };
}
