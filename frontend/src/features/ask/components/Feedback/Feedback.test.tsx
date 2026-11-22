import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Feedback } from './Feedback';

it('Feedback asks once and thanks after a rating', async () => {
  const onRate = vi.fn();
  const { rerender } = render(<Feedback rated={null} pending={false} onRate={onRate} />);
  await userEvent.click(screen.getByRole('button', { name: '👍 Evet' }));
  expect(onRate).toHaveBeenCalledWith('helpful');
  rerender(<Feedback rated="helpful" pending={false} onRate={onRate} />);
  expect(screen.getByText('Teşekkürler, geri bildiriminiz kaydedildi.')).toBeInTheDocument();
});
