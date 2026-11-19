import { uploadWithProgress } from './upload';

class FakeXhr {
  static last: FakeXhr;
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 0;
  responseText = '';
  withCredentials = false;
  url = '';
  constructor() {
    FakeXhr.last = this;
  }
  open(_m: string, url: string) {
    this.url = url;
  }
  send() {}
  abort() {
    this.onabort?.();
  }
}

describe('uploadWithProgress', () => {
  beforeEach(() => vi.stubGlobal('XMLHttpRequest', FakeXhr));

  it('reports progress and resolves with JSON', async () => {
    const progress: number[] = [];
    const p = uploadWithProgress('/up', new FormData(), (f) => progress.push(f));
    const xhr = FakeXhr.last;
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
    xhr.status = 201;
    xhr.responseText = '{"id":7}';
    xhr.onload?.();
    await expect(p).resolves.toEqual({ id: 7 });
    expect(progress).toEqual([0.5]);
    expect(xhr.url).toBe('/api/up');
    expect(xhr.withCredentials).toBe(true);
  });

  it('rejects with ApiError on a 4xx and on network errors', async () => {
    const p = uploadWithProgress('/up', new FormData(), () => {});
    FakeXhr.last.status = 413;
    FakeXhr.last.onload?.();
    await expect(p).rejects.toMatchObject({ status: 413 });
    const q = uploadWithProgress('/up', new FormData(), () => {});
    FakeXhr.last.onerror?.();
    await expect(q).rejects.toBeInstanceOf(TypeError);
  });
});
