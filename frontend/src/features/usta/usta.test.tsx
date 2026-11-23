import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { inboxQuestion, languages, me, ustaProfile } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { AlertsProvider } from '../alerts';
import { ReplyPage, UstaHomePage, UstaProfilePage } from '.';

class FakeSocket {
  static last: FakeSocket | null = null;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor() { FakeSocket.last = this; }
  close() {}
}

const home = () => renderAuthed(<AlertsProvider><UstaHomePage /></AlertsProvider>);

class OkXhr {
  upload = { onprogress: null };
  status = 200;
  responseText = '{}';
  withCredentials = false;
  onload: (() => void) | null = null;
  static sent: FormData | null = null;
  static url = '';
  open(_m: string, url: string) { OkXhr.url = url; }
  send(form: FormData) { OkXhr.sent = form; setTimeout(() => this.onload?.(), 0); }
}

describe('usta screens', () => {
  it('home lists open questions, his machines and his answers (KAN-62, KAN-65)', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me('usta'), 'GET /me/inbox': [inboxQuestion], 'GET /ustas/7': ustaProfile, 'GET /machines?q=': [], 'GET /machines?q=fork': [{ id: 2, code: 'FL-03', name: 'Forklift 3', location: 'Depo' }] });
    vi.stubGlobal('WebSocket', FakeSocket);
    home();
    expect(await screen.findByRole('heading', { name: /İşçilerden sorular/ })).toHaveTextContent('1 açık');
    expect(screen.getByRole('link', { name: /Kesimin altında çapak/ })).toHaveAttribute('href', '/usta/questions/51');
    expect(screen.getByRole('link', { name: 'PK-105 · Plazma Kesim Makinesi' })).toBeInTheDocument();
    expect(screen.getByText(/toprak pensesini/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Video çek/ })).toHaveAttribute('href', '/record');
    await userEvent.type(screen.getByLabelText('Makine ara'), 'fork'); // searched on the backend, any machine
    expect(await screen.findByRole('link', { name: 'FL-03 · Forklift 3 · Depo' })).toHaveAttribute('href', '/m/2');
    expect(calls.some((c) => c.path === '/machines?q=fork')).toBe(true);
  });

  it('home shows a worker\'s new question as soon as its live alert arrives', async () => {
    vi.stubGlobal('WebSocket', FakeSocket);
    let asked = false;
    mockApi({ 'GET /auth/me': me('usta'), 'GET /me/inbox': () => (asked ? [inboxQuestion] : []), 'GET /ustas/7': ustaProfile, 'GET /alerts': { unread_count: 0, items: [] } });
    home();
    expect(await screen.findByRole('heading', { name: /İşçilerden sorular/ })).toHaveTextContent('0 açık');
    asked = true;
    act(() => FakeSocket.last?.onmessage?.({ data: JSON.stringify({ id: 5, text: 'Yeni soru', created_at: '2026-11-22T10:00:00', read: false, path: '/usta/questions/51' }) }));
    expect(await screen.findByRole('heading', { name: /İşçilerden sorular/ })).toHaveTextContent('1 açık');
  });

  it('replies with text and confirms (KAN-63)', async () => {
    vi.stubGlobal('XMLHttpRequest', OkXhr);
    mockApi({ 'GET /auth/me': me('usta'), 'GET /questions/51': inboxQuestion });
    renderAuthed(<ReplyPage />, '/usta/questions/51', '/usta/questions/:questionId');
    expect(await screen.findByText('يتكون نتوء تحت القطع، ماذا أفعل؟')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Cevabın'), 'Hızı %10 düşür');
    await userEvent.click(screen.getByRole('button', { name: 'Cevabı gönder' }));
    expect(await screen.findByText('Gönderildi')).toBeInTheDocument();
    expect(OkXhr.url).toBe('/api/questions/51/answer');
    expect(OkXhr.sent?.get('text')).toBe('Hızı %10 düşür');
  });

  it('shows the question in another language the usta picks', async () => {
    const german = { ...inboxQuestion, question: { text: 'Unter dem Schnitt bildet sich ein Grat', lang: 'de', dir: 'ltr' as const } };
    const { calls } = mockApi({
      'GET /auth/me': me('usta'),
      'GET /questions/51': inboxQuestion,
      'GET /questions/51?lang=de': german,
      'GET /languages': languages,
    });
    renderAuthed(<ReplyPage />, '/usta/questions/51', '/usta/questions/:questionId');
    expect(await screen.findByRole('button', { name: 'Soruyu şu dilde göster' })).toHaveTextContent('Türkçe');
    await userEvent.click(screen.getByRole('button', { name: 'Soruyu şu dilde göster' }));
    await userEvent.type(screen.getByRole('combobox'), 'alman');
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText('Unter dem Schnitt bildet sich ein Grat')).toBeInTheDocument();
    expect(calls.some((c) => c.path === '/questions/51?lang=de')).toBe(true);
  });

  it('profile shows machines and answered questions (KAN-28)', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /ustas/7': ustaProfile });
    renderAuthed(<UstaProfilePage />, '/ustas/7', '/ustas/:ustaId');
    expect(await screen.findByRole('heading', { name: 'Mehmet Usta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AB-01 · Abkant Pres' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Cevapladığı sorular/ })).toHaveTextContent('1');
  });
});
