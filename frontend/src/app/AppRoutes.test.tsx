import { render, screen } from '@testing-library/react';
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
