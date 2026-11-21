import type { Page, WebSocketRoute } from '@playwright/test';
import type { Me, Role } from '../src/api/types';
import * as fx from '../src/test/fixtures';

type Body = object | null;
type Handler = Body | ((req: { body: unknown; url: URL }) => Body | { status: number; body: Body });
export type Routes = Record<string, Handler>;

const defaults = (): Routes => ({
  'GET /languages': fx.languages,
  'GET /alerts': { unread_count: 0, items: [] },
  'GET /machines/1': fx.machinePage,
  'GET /videos/1': fx.videoDetail,
  'GET /documents/1': fx.documentDetail,
  'GET /me/questions': fx.myQuestions,
  'GET /me/inbox': [fx.inboxQuestion],
  'GET /ustas/7': fx.ustaProfile,
  'GET /questions/51': fx.inboxQuestion,
  'GET /me/machines': [{ id: 1, code: 'PK-105', name: 'Plazma Kesim Makinesi' }],
  'GET /me/maintenance': [fx.maintenanceRecord],
  'GET /admin/machines?q=': fx.adminMachines,
  'GET /admin/users': fx.adminUsers,
  'POST /auth/logout': null,
});

/**
 * shortcut: stands in for the FastAPI backend until it is scaffolded. Same shapes as src/api/types.ts.
 * `loggedIn: false` starts anonymous; POST /auth/login then logs in as `role`.
 */
export async function mockBackend(page: Page, opts: { role: Role; loggedIn?: boolean; routes?: Routes }) {
  let user: Me | null = opts.loggedIn === false ? null : fx.me(opts.role);
  const routes: Routes = {
    ...defaults(),
    'POST /auth/login': () => (user = fx.me(opts.role)),
    'POST /auth/register': ({ body }) => {
      const name = body && typeof body === 'object' && 'name' in body ? String(body.name) : '';
      const usta = body && typeof body === 'object' && 'role' in body && body.role === 'usta';
      user = { ...fx.me(usta ? 'usta' : 'worker'), name };
      return { status: 201, body: user };
    },
    'PATCH /me/language': ({ body }) => {
      const lang = body && typeof body === 'object' && 'language' in body ? String(body.language) : 'tr';
      user = fx.me(opts.role, lang);
      return user;
    },
    ...opts.routes,
  };
  const calls: { key: string; body: unknown }[] = [];

  await page.route((u) => u.pathname.startsWith('/api/'), async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace(/^\/api/, '') + url.search;
    const key = `${req.method()} ${path}`;
    let body: unknown = null;
    try { body = req.postDataJSON(); } catch { body = req.postData(); }
    calls.push({ key, body });
    if (key === 'GET /auth/me') {
      return user ? route.fulfill({ json: user }) : route.fulfill({ status: 401, json: { detail: 'Giriş gerekli.' } });
    }
    const hit = routes[key];
    if (hit === undefined) return route.fulfill({ status: 404, json: { detail: 'Bulunamadı.' } });
    const out = typeof hit === 'function' ? hit({ body, url }) : hit;
    if (out && typeof out === 'object' && 'status' in out && typeof out.status === 'number' && 'body' in out) {
      return route.fulfill({ status: out.status, json: out.body });
    }
    return out === null ? route.fulfill({ status: 204 }) : route.fulfill({ json: out });
  });

  // Fixture media URLs (/uploads/videos/1/original.mp4, ...) must not reach a real backend through the Vite proxy.
  await page.route((u) => u.pathname.startsWith('/uploads/'), (route) => {
    calls.push({ key: `GET ${new URL(route.request().url()).pathname}`, body: null });
    return route.fulfill({ status: 404, body: '' });
  });

  let socket: WebSocketRoute | null = null;
  await page.routeWebSocket('**/api/ws/alerts', (ws) => { socket = ws; });

  return {
    calls,
    pushAlert: (alert: object) => socket?.send(JSON.stringify(alert)),
  };
}
