import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { alertList, languages, machinePage, me } from '../test/fixtures';
import { mockApi } from '../test/utils';
import { AppRoutes } from './AppRoutes';

class NoSocket {
  close() {}
}

const app = (url: string) => render(<MemoryRouter initialEntries={[url]}><AppRoutes /></MemoryRouter>);

describe('AppRoutes', () => {
  beforeEach(() => vi.stubGlobal('WebSocket', NoSocket));

  it('opens a scanned machine page inside the shell with bell and role menu', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /alerts': alertList, 'GET /languages': languages, 'GET /machines/1': machinePage });
    app('/m/1');
    expect(await screen.findByRole('heading', { name: 'Plazma Kesim Makinesi' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Bildirimler, 1 okunmamış' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Ana menü' })).toHaveTextContent('Sorularım');
  });

  it('switches the site language from the header, saves it and reloads the page in it (KAN-46)', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me('worker'), 'GET /alerts': alertList, 'GET /languages': languages, 'GET /machines/1': machinePage, 'PATCH /me/language': me('worker', 'ar') });
    app('/m/1');
    await screen.findByRole('heading', { name: 'Plazma Kesim Makinesi' });
    await userEvent.click(await screen.findByRole('button', { name: 'Site dili' }));
    await userEvent.type(screen.getByRole('combobox', { name: 'Site dili: ara' }), 'arap');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Site dili' })).toHaveTextContent('AR'));
    expect(calls.find((c) => c.method === 'PATCH')?.body).toEqual({ language: 'ar' });
    await waitFor(() => expect(calls.filter((c) => c.path === '/machines/1')).toHaveLength(2));
  });

  it('sends anonymous users to login', async () => {
    mockApi({});
    app('/m/1');
    expect(await screen.findByRole('heading', { name: 'Giriş' })).toBeInTheDocument();
  });

  it('logs out from the header', async () => {
    mockApi({ 'GET /auth/me': me('patron'), 'GET /alerts': alertList, 'GET /admin/users': [], 'POST /auth/logout': null });
    app('/panel/users');
    await userEvent.click(await screen.findByRole('button', { name: 'Çıkış yap' }));
    expect(await screen.findByRole('heading', { name: 'Giriş' })).toBeInTheDocument();
  });

  it('after logout, the next user lands on their own home, not the previous page', async () => {
    mockApi({
      'GET /auth/me': me('patron'), 'GET /alerts': alertList, 'GET /admin/users': [], 'POST /auth/logout': null,
      'POST /auth/login': me('technician'), 'GET /me/maintenance': [],
    });
    app('/panel/users');
    await userEvent.click(await screen.findByRole('button', { name: 'Çıkış yap' }));
    await userEvent.type(await screen.findByLabelText('Telefon veya e-posta'), 'emre');
    await userEvent.type(screen.getByLabelText('Şifre'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(await screen.findByRole('heading', { name: 'Son kayıtlarım' })).toBeInTheDocument();
  });
});
