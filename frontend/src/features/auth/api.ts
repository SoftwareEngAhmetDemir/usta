import { postJson, request } from '../../api';
import type { LanguageCode, LoginIn, Me } from '../../api';

export const fetchMe = (): Promise<Me> => request<Me>('/auth/me');
export const login = (body: LoginIn): Promise<Me> => postJson<Me>('/auth/login', body);
export const logout = (): Promise<null> => postJson<null>('/auth/logout', {});
export const updateLanguage = (language: LanguageCode): Promise<Me> => postJson<Me>('/me/language', { language }, 'PATCH');
