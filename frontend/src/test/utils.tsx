import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { OtherPage } from './OtherPage';
import { AuthProvider, RequireAuth } from '../features/auth';
import { vi } from 'vitest';

type Json = object | null;
export type Routes_ = Record<string, Json | ((init: RequestInit | undefined) => Json)>;

/** Stub fetch: keys are "METHOD /path" (path without /api, query included). Unknown routes return 404. */
export function mockApi(routes: Routes_) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://test');
    const path = url.pathname.replace(/^\/api/, '') + url.search;
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body;
    calls.push({ method, path, body });
    const hit = routes[`${method} ${path}`];
    if (hit === undefined) return new Response(JSON.stringify({ detail: 'Bulunamadı.' }), { status: 404 });
    const data = typeof hit === 'function' ? hit(init) : hit;
    return new Response(data === null ? null : JSON.stringify(data), { status: data === null ? 204 : 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, calls };
}

/** Render `ui` inside a router at `url`; `pattern` gives route params to the element. */
export function renderAt(ui: ReactElement, url = '/', pattern = '*'): RenderResult {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path={pattern} element={ui} />
        <Route path="*" element={<OtherPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Like renderAt, but inside AuthProvider + RequireAuth. Mock 'GET /auth/me' with a fixture user. */
export function renderAuthed(ui: ReactElement, url = '/', pattern = '*'): RenderResult {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <Routes>
          <Route path={pattern} element={<RequireAuth>{ui}</RequireAuth>} />
          <Route path="*" element={<OtherPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

