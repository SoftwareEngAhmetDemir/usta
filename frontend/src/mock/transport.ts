// Routes the app's /api traffic (fetch, XHR uploads, alerts WebSocket) to the in-browser fake backend.
import type { Alert } from '../api/types';
import { load, save, type MockDb } from './db';
import { handle, type MockResponse } from './handlers';

const DELAY_MS = 250;
const sockets = new Set<{ onmessage: ((e: MessageEvent<string>) => void) | null }>();

const apiPath = (url: string): string | null => {
  const u = new URL(url, window.location.origin);
  return u.pathname.startsWith('/api/') ? u.pathname.slice(4) + u.search : null;
};

function parseBody(body: unknown): unknown {
  if (typeof body !== 'string') return body ?? null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

/** Run one request against the stored db, persist, and push any new alert for the logged-in user. */
export function run(method: string, path: string, body: unknown): MockResponse {
  const db: MockDb = load();
  const role = db.user?.role;
  const before = new Set(role ? db.alerts[role].map((a) => a.id) : []);
  const res = handle(db, { method, path, body: parseBody(body) });
  save(db);
  const after = db.user?.role;
  if (after && after === role) {
    const fresh: Alert[] = db.alerts[after].filter((a) => !before.has(a.id));
    fresh.forEach((a) => sockets.forEach((s) => s.onmessage?.(new MessageEvent('message', { data: JSON.stringify(a) }))));
  }
  return res;
}

function installFetch(): void {
  const real = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = apiPath(input instanceof Request ? input.url : String(input));
    if (path === null) return real(input, init);
    await new Promise((r) => setTimeout(r, DELAY_MS));
    const res = run(init?.method ?? 'GET', path, init?.body);
    return new Response(res.status === 204 ? null : JSON.stringify(res.body), { status: res.status, headers: { 'Content-Type': 'application/json' } });
  };
}

/** Just enough of XMLHttpRequest for src/api/upload.ts, with fake upload progress. */
class MockXhr {
  upload: { onprogress: ((e: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  withCredentials = false;
  status = 0;
  responseText = '';
  private method = 'GET';
  private url = '';
  private aborted = false;

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }
  abort(): void {
    this.aborted = true;
    this.onabort?.();
  }
  send(body: unknown): void {
    const path = apiPath(this.url) ?? this.url;
    [0.25, 0.5, 0.75, 1].forEach((f, i) =>
      setTimeout(() => {
        if (!this.aborted) this.upload.onprogress?.(new ProgressEvent('progress', { lengthComputable: true, loaded: f * 100, total: 100 }));
      }, 200 * (i + 1)),
    );
    setTimeout(() => {
      if (this.aborted) return;
      const res = run(this.method, path, body);
      this.status = res.status;
      this.responseText = res.status === 204 ? '' : JSON.stringify(res.body);
      this.onload?.();
    }, 1000);
  }
}

function installWebSocket(): void {
  const Real = window.WebSocket;
  class AlertSocketOrReal {
    constructor(url: string | URL, protocols?: string | string[]) {
      if (!String(url).includes('/api/ws/alerts')) return new Real(url, protocols); // keep Vite HMR working
      const fake = { onopen: null, onclose: null, onmessage: null, close: () => sockets.delete(fake) };
      sockets.add(fake);
      return fake as unknown as AlertSocketOrReal;
    }
  }
  Object.defineProperty(window, 'WebSocket', { value: AlertSocketOrReal, configurable: true });
}

export function installTransport(): void {
  installFetch();
  Object.defineProperty(window, 'XMLHttpRequest', { value: MockXhr, configurable: true });
  installWebSocket();
}
