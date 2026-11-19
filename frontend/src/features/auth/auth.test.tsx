import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockApi } from '../../test/utils';
import { AuthProvider, LoginPage, RequireAuth, useAuth } from '.';

const me = { id: 1, name: 'Yusuf', role: 'worker', language: 'ar', authorized: false, authorization_note: null };

function Logout() {
  const { signOut } = useAuth();
  return <button onClick={() => void signOut()}>Çıkış</button>;
}

function app(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/m/:id" element={<RequireAuth><p>machine page</p><Logout /></RequireAuth>} />
          <Route path="/scan" element={<RequireAuth><p>scan page</p></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('auth flow (KAN-24)', () => {
  it('returns to the scanned machine page after login', async () => {
    const { calls } = mockApi({ 'POST /auth/login': me });
    app('/m/1');
    await userEvent.type(await screen.findByLabelText('Telefon veya e-posta'), 'yusuf');
    await userEvent.type(screen.getByLabelText('Şifre'), 'pw');
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(await screen.findByText('machine page')).toBeInTheDocument();
    expect(calls.find((c) => c.path === '/auth/login')?.body).toEqual({ login: 'yusuf', password: 'pw' });
  });

  it('goes to the role home when there is no saved target', async () => {
    mockApi({ 'POST /auth/login': me });
    app('/login');
    await userEvent.type(await screen.findByLabelText('Telefon veya e-posta'), 'y');
    await userEvent.type(screen.getByLabelText('Şifre'), 'p');
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(await screen.findByText('scan page')).toBeInTheDocument();
  });

  it('stays logged in from the session cookie and logs out', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me, 'POST /auth/logout': null });
    app('/m/1');
    expect(await screen.findByText('machine page')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Çıkış' }));
    expect(await screen.findByRole('heading', { name: 'Giriş' })).toBeInTheDocument();
    expect(calls.some((c) => c.method === 'POST' && c.path === '/auth/logout')).toBe(true);
  });
});
