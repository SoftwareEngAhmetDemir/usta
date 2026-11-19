import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockApi } from '../../test/utils';
import { AlertsPage, AlertsProvider, AlertToast, useAlerts } from '.';
import { alertSocketUrl } from './api';

class FakeSocket {
  static all: FakeSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  url: string;
  constructor(url: string) {
    this.url = url;
    FakeSocket.all.push(this);
  }
  close() {}
}

const unread = { id: 1, text: 'Yeni soru · Forklift 3', created_at: '2026-11-19T10:00:00', read: false, path: '/usta/questions/4' };

function Toast() {
  const { toast, open } = useAlerts();
  return <AlertToast alert={toast} onOpen={open} />;
}

function app() {
  return render(
    <MemoryRouter initialEntries={['/alerts']}>
      <AlertsProvider>
        <Toast />
        <Routes>
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/usta/questions/:id" element={<p>reply screen</p>} />
        </Routes>
      </AlertsProvider>
    </MemoryRouter>,
  );
}

describe('alerts (KAN-66)', () => {
  beforeEach(() => {
    FakeSocket.all = [];
    vi.stubGlobal('WebSocket', FakeSocket);
  });

  it('loads saved alerts, opens the related screen and marks it read', async () => {
    const { calls } = mockApi({ 'GET /alerts': { unread_count: 1, items: [unread] }, 'POST /alerts/1/read': { unread_count: 0, items: [] } });
    app();
    await userEvent.click(await screen.findByRole('button', { name: /Yeni soru/ }));
    expect(await screen.findByText('reply screen')).toBeInTheDocument();
    expect(calls.some((c) => c.path === '/alerts/1/read')).toBe(true);
  });

  it('pops up a live alert from the WebSocket and refreshes the list', async () => {
    const { calls } = mockApi({ 'GET /alerts': { unread_count: 0, items: [] } });
    app();
    await waitFor(() => expect(FakeSocket.all).toHaveLength(1));
    act(() => FakeSocket.all[0]?.onmessage?.({ data: JSON.stringify(unread) }));
    expect(await screen.findByRole('button', { name: /Yeni soru · Forklift 3/ })).toHaveClass('toast');
    await waitFor(() => expect(calls.filter((c) => c.path === '/alerts')).toHaveLength(2));
  });

  it('builds the socket URL from the page origin', () => {
    expect(alertSocketUrl({ protocol: 'https:', host: 'x.devtunnels.ms' })).toBe('wss://x.devtunnels.ms/api/ws/alerts');
    expect(alertSocketUrl({ protocol: 'http:', host: 'localhost:5173' })).toBe('ws://localhost:5173/api/ws/alerts');
  });
});
