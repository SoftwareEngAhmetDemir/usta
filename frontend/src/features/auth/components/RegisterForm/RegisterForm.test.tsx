import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../../../api';
import { RegisterForm } from './RegisterForm';

async function fill() {
  await userEvent.type(screen.getByLabelText('Ad soyad'), ' Yusuf Kaya ');
  await userEvent.type(screen.getByLabelText('Telefon veya e-posta'), ' 0532 123 45 67 ');
  await userEvent.type(screen.getByLabelText('Şifre (en az 8 karakter)'), 'gizli-sifre');
  await userEvent.click(screen.getByRole('button', { name: 'Kayıt ol' }));
}

describe('RegisterForm', () => {
  it('asks for every field before submitting', async () => {
    const onSubmit = vi.fn();
    render(<RegisterForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Ad soyad'), 'Yusuf');
    await userEvent.click(screen.getByRole('button', { name: 'Kayıt ol' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ad, telefon/e-posta ve şifre girin.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed name and login, password as typed, İşçi by default', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RegisterForm onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: 'İşçi' })).toHaveAttribute('aria-pressed', 'true');
    await fill();
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Yusuf Kaya', login: '0532 123 45 67', password: 'gizli-sifre', role: 'worker' });
  });

  it('offers only İşçi and Usta, and sends the chosen role', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RegisterForm onSubmit={onSubmit} />);
    const roles = screen.getByRole('group', { name: 'Rol' });
    expect(Array.from(roles.querySelectorAll('button'), (b) => b.textContent)).toEqual(['İşçi', 'Usta']);
    await userEvent.click(screen.getByRole('button', { name: 'Usta' }));
    expect(screen.getByRole('button', { name: 'Usta' })).toHaveAttribute('aria-pressed', 'true');
    await fill();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ role: 'usta' }));
  });

  it("shows the backend's message, e.g. login already taken", async () => {
    const taken = new ApiError(409, { detail: 'Bu telefon/e-posta ile zaten bir hesap var.' });
    render(<RegisterForm onSubmit={() => Promise.reject(taken)} />);
    await fill();
    expect(await screen.findByRole('alert')).toHaveTextContent('Bu telefon/e-posta ile zaten bir hesap var.');
    expect(screen.getByRole('button', { name: 'Kayıt ol' })).toBeEnabled();
  });
});
