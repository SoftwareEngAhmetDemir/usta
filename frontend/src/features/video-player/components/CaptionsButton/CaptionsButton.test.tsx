import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaptionsButton } from './CaptionsButton';

it('CaptionsButton shows whether subtitles are on and toggles them', async () => {
  const onToggle = vi.fn();
  render(<CaptionsButton on={false} onToggle={onToggle} />);
  const cc = screen.getByRole('button', { name: 'Altyazı (CC)' });
  expect(cc).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(cc);
  expect(onToggle).toHaveBeenCalledOnce();
});
