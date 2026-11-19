import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoLogin } from './DemoLogin';

it('DemoLogin logs in as the chosen fake role', async () => {
  const onLogin = vi.fn();
  render(<DemoLogin onLogin={onLogin} />);
  await userEvent.click(screen.getByRole('button', { name: '🔧 Teknisyen' }));
  expect(onLogin).toHaveBeenCalledWith({ login: 'teknisyen', password: 'demo' });
});
