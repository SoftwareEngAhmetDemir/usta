import { postJson } from '../../api';
import type { LanguageCode, Preparation } from '../../api';

/** Prepare a language on demand; the backend never prepares the same video + language twice (KAN-55). */
export const requestLanguage = (videoId: number, lang: LanguageCode): Promise<Preparation> =>
  postJson<Preparation>(`/videos/${videoId}/languages/${lang}`, {});

export const retryStep = (videoId: number, lang: LanguageCode, step: string): Promise<Preparation> =>
  postJson<Preparation>(`/videos/${videoId}/languages/${lang}/steps/${step}/retry`, {});
