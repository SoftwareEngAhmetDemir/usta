import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockApi } from '../../test/utils';
import { AuthProvider, LoginPage, RegisterPage, RequireAuth, useAuth } from '.';

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
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/m/:id" element={<RequireAuth><p>machine page</p><Logout /></RequireAuth>} />
          <Route path="/scan" element={<RequireAuth><p>scan page</p></RequireAuth>} />
          <Route path="/usta" element={<RequireAuth><p>usta home</p></RequireAuth>} />
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

  it('links from login to sign-up and back', async () => {
    mockApi({});
    app('/login');
    await userEvent.click(await screen.findByRole('link', { name: 'Kayıt ol' }));
    expect(screen.getByRole('heading', { name: 'Kayıt ol' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Giriş yap' }));
    expect(screen.getByRole('heading', { name: 'Giriş' })).toBeInTheDocument();
  });

  it('signs up from the login page and still returns to the scanned machine', async () => {
    const { calls } = mockApi({ 'POST /auth/register': me });
    app('/m/1');
    await userEvent.click(await screen.findByRole('link', { name: 'Kayıt ol' }));
    await userEvent.type(screen.getByLabelText('Ad soyad'), 'Yusuf');
    await userEvent.type(screen.getByLabelText('Telefon veya e-posta'), '05321234567');
    await userEvent.type(screen.getByLabelText('Şifre (en az 8 karakter)'), 'gizli-sifre');
    await userEvent.click(screen.getByRole('button', { name: 'Kayıt ol' }));
    expect(await screen.findByText('machine page')).toBeInTheDocument();
    expect(calls.find((c) => c.path === '/auth/register')?.body).toEqual({
      name: 'Yusuf', login: '05321234567', password: 'gizli-sifre', role: 'worker',
    });
  });

  it('signing up as Usta lands on the usta home', async () => {
    const { calls } = mockApi({ 'POST /auth/register': { ...me, role: 'usta' } });
    app('/register');
    await userEvent.click(await screen.findByRole('button', { name: 'Usta' }));
    await userEvent.type(screen.getByLabelText('Ad soyad'), 'Ali Usta');
    await userEvent.type(screen.getByLabelText('Telefon veya e-posta'), 'ali@firma.com');
    await userEvent.type(screen.getByLabelText('Şifre (en az 8 karakter)'), 'gizli-sifre');
    await userEvent.click(screen.getByRole('button', { name: 'Kayıt ol' }));
    expect(await screen.findByText('usta home')).toBeInTheDocument();
    expect(calls.find((c) => c.path === '/auth/register')?.body).toMatchObject({ role: 'usta' });
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
