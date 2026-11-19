import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../../../api';
import { LoginForm } from './LoginForm';

async function fill() {
  await userEvent.type(screen.getByLabelText('Telefon veya e-posta'), ' 0555 ');
  await userEvent.type(screen.getByLabelText('Şifre'), 'gizli');
  await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
}

describe('LoginForm', () => {
  it('asks for both fields before submitting', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Telefon/e-posta ve şifre girin.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed credentials', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<LoginForm onSubmit={onSubmit} />);
    await fill();
    expect(onSubmit).toHaveBeenCalledWith({ login: '0555', password: 'gizli' });
  });

  it('shows a Turkish message for wrong credentials', async () => {
    render(<LoginForm onSubmit={() => Promise.reject(new ApiError(401, null))} />);
    await fill();
    expect(await screen.findByRole('alert')).toHaveTextContent('Telefon/e-posta veya şifre hatalı.');
  });
});
