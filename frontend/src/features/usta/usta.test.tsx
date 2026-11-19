import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { inboxQuestion, me, ustaProfile } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { ReplyPage, UstaHomePage, UstaProfilePage } from '.';

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
    mockApi({ 'GET /auth/me': me('usta'), 'GET /me/inbox': [inboxQuestion], 'GET /ustas/7': ustaProfile });
    renderAuthed(<UstaHomePage />);
    expect(await screen.findByRole('heading', { name: /İşçilerden sorular/ })).toHaveTextContent('1 açık');
    expect(screen.getByRole('link', { name: /Kesimin altında çapak/ })).toHaveAttribute('href', '/usta/questions/51');
    expect(screen.getByRole('link', { name: 'PK-105 · Plazma Kesim Makinesi' })).toBeInTheDocument();
    expect(screen.getByText(/toprak pensesini/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Video çek/ })).toHaveAttribute('href', '/record');
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

  it('profile shows machines and answered questions (KAN-28)', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /ustas/7': ustaProfile });
    renderAuthed(<UstaProfilePage />, '/ustas/7', '/ustas/:ustaId');
    expect(await screen.findByRole('heading', { name: '🧰 Mehmet Usta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AB-01 · Abkant Pres' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Cevapladığı sorular/ })).toHaveTextContent('1');
  });
});
