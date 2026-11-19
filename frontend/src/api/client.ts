export const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;
  constructor(status: number, detail: unknown) {
    super(`API ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

async function parse<T>(res: Response): Promise<T> {
  const body: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T; // shortcut: trusts the backend schema; generate types from /openapi.json once the backend exists
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: isForm ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
  });
  return parse<T>(res);
}

export const postJson = <T>(path: string, body: unknown, method = 'POST'): Promise<T> =>
  request<T>(path, { method, body: JSON.stringify(body) });

export const postForm = <T>(path: string, form: FormData): Promise<T> =>
  request<T>(path, { method: 'POST', body: form });

/** Turkish message for the user. FastAPI sends `{ detail: string }` for handled errors. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail = error.detail;
    if (detail && typeof detail === 'object' && 'detail' in detail && typeof detail.detail === 'string') {
      return detail.detail;
    }
    if (error.status === 404) return 'Bulunamadı.';
    if (error.status === 403) return 'Bu işlem için yetkiniz yok.';
    if (error.status >= 500) return 'Sunucu hatası. Biraz sonra tekrar deneyin.';
  }
  return 'Bağlantı hatası. İnternetinizi kontrol edip tekrar deneyin.';
}
