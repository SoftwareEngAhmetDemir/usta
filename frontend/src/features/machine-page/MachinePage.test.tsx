import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { languages, machinePage, me } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { MachinePage } from './MachinePage';

const show = (url = '/m/1') => renderAuthed(<MachinePage />, url, '/m/:machineId');

describe('MachinePage (KAN-71)', () => {
  it('shows every section in order', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /languages': languages, 'GET /machines/1': machinePage });
    show();
    expect(await screen.findByRole('heading', { name: 'Plazma Kesim Makinesi' })).toBeInTheDocument();
    const order = ['Makine bilgileri', 'Bu makineyi bilen ustalar', 'Makineye sor', 'Videolar', 'Dokümanlar', 'Bakım geçmişi', 'Sorular & cevaplar'];
    const text = document.body.textContent ?? '';
    const positions = order.map((t) => (t === 'Makine bilgileri' ? text.indexOf('Plazma Kesim Makinesi') : text.indexOf(t)));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(screen.getByRole('link', { name: /Makineye sor/ })).toHaveAttribute('href', '/m/1/ask');
  });

  it('shows empty messages and role actions from the API', async () => {
    const empty = { ...machinePage, ustas: [], videos: [], external_videos: [], documents: [], maintenance: [], questions: [], actions: { ask: true, record_video: true, upload_document: true, record_maintenance: true, archive: true, qr: true } };
    mockApi({ 'GET /auth/me': me('patron'), 'GET /languages': languages, 'GET /machines/1': empty });
    show();
    for (const msg of ['Henüz video yok.', 'Henüz doküman yok.', 'Henüz bakım kaydı yok.', 'Henüz soru yok.', 'Henüz bağlı usta yok.']) {
      expect(await screen.findByText(msg)).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Video çek' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Belge yükle' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Etiketi yazdır (PDF)' })).toHaveAttribute('href', '/api/machines/1/sticker.pdf');
  });

  it('hides the QR section without the qr action (workers)', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /languages': languages, 'GET /machines/1': machinePage });
    show();
    await screen.findByRole('heading', { name: 'Plazma Kesim Makinesi' });
    expect(screen.queryByText('QR kodu')).not.toBeInTheDocument();
  });

  it('lets the machine\'s usta remove it after confirming, then goes home (KAN-27)', async () => {
    const page = { ...machinePage, actions: { ...machinePage.actions, archive: true } };
    const { calls } = mockApi({ 'GET /auth/me': me('usta'), 'GET /languages': languages, 'GET /machines/1': page, 'POST /machines/1/archive': null });
    show();
    await userEvent.click(await screen.findByRole('button', { name: 'Makineyi kaldır' }));
    expect(calls.some((c) => c.path === '/machines/1/archive')).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Evet, kaldır' }));
    expect(await screen.findByText('other page /')).toBeInTheDocument();
    expect(calls.filter((c) => c.method === 'POST' && c.path === '/machines/1/archive')).toHaveLength(1);
  });

  it('hides "Makineyi kaldır" without the archive action', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /languages': languages, 'GET /machines/1': machinePage });
    show();
    await screen.findByRole('heading', { name: 'Plazma Kesim Makinesi' });
    expect(screen.queryByRole('button', { name: 'Makineyi kaldır' })).not.toBeInTheDocument();
  });

  it('shows a clear not-found message for an unknown machine', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /languages': languages });
    show('/m/999');
    expect(await screen.findByRole('alert')).toHaveTextContent('Bulunamadı.');
  });
});
