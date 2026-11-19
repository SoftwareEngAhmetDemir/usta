import { ApiError, errorMessage, postForm, postJson, request } from './client';
import { mockApi } from '../test/utils';

describe('request', () => {
  it('returns parsed JSON and sends cookies', async () => {
    const { fetchMock } = mockApi({ 'GET /machines/1': { id: 1 } });
    await expect(request('/machines/1')).resolves.toEqual({ id: 1 });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'include' });
  });

  it('throws ApiError with the status and body', async () => {
    mockApi({});
    await expect(request('/nope')).rejects.toMatchObject({ status: 404, detail: { detail: 'Bulunamadı.' } });
  });

  it('postJson sends a JSON body', async () => {
    const { calls } = mockApi({ 'POST /x': { ok: true } });
    await postJson('/x', { a: 1 });
    expect(calls[0]).toEqual({ method: 'POST', path: '/x', body: { a: 1 } });
  });

  it('postForm sends multipart without forcing a JSON content type', async () => {
    const { fetchMock } = mockApi({ 'POST /up': { id: 2 } });
    const form = new FormData();
    form.append('title', 'Kılavuz');
    await expect(postForm('/up', form)).resolves.toEqual({ id: 2 });
    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.body).toBe(form);
    expect(init?.headers).toBeUndefined();
  });

  it('returns null for 204 No Content', async () => {
    mockApi({ 'POST /auth/logout': null });
    await expect(postJson('/auth/logout', {})).resolves.toBeNull();
  });
});

describe('errorMessage', () => {
  it('uses the FastAPI detail string', () => {
    expect(errorMessage(new ApiError(400, { detail: 'Şifre hatalı.' }))).toBe('Şifre hatalı.');
  });
  it('falls back by status, then to a network message', () => {
    expect(errorMessage(new ApiError(403, null))).toBe('Bu işlem için yetkiniz yok.');
    expect(errorMessage(new ApiError(502, null))).toMatch(/Sunucu/);
    expect(errorMessage(new TypeError('x'))).toMatch(/Bağlantı/);
  });
});
