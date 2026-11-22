import { useState } from 'react';
import type { InboxQuestion, Language, LanguageCode } from '../../../api';
import { useApi } from '../../../api';
import { useMe } from '../../auth';

/** The question in the usta's own language, or in another one they pick (the backend translates it). */
export function useQuestionIn(questionId: number) {
  const me = useMe();
  const [lang, setLang] = useState<LanguageCode>(me.language);
  const query = lang === me.language ? '' : `?lang=${encodeURIComponent(lang)}`;
  const { state, reload } = useApi<InboxQuestion>(`/questions/${questionId}${query}`);
  const languages = useApi<Language[]>('/languages').state;
  return { state, reload, lang, setLang, languages: languages.status === 'ok' ? languages.data : [] };
}
