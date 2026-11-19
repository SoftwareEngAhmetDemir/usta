import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertToast } from './AlertToast';

const alert = { id: 1, text: 'Yeni soru', created_at: '2026-11-19T10:00:00', read: false, path: '/usta/questions/4' };

it('AlertToast opens the alert on tap', async () => {
  const onOpen = vi.fn();
  render(<AlertToast alert={alert} onOpen={onOpen} />);
  await userEvent.click(screen.getByRole('button', { name: /Yeni soru/ }));
  expect(onOpen).toHaveBeenCalledWith(alert);
});
