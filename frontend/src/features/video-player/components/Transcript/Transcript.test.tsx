import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { videoDetail } from '../../../../test/fixtures';
import { Transcript } from './Transcript';

it('Transcript highlights the current line and seeks on tap', async () => {
  const onSeek = vi.fn();
  render(<Transcript segments={videoDetail.transcript} lang="tr" dir="ltr" currentSec={120} onSeek={onSeek} />);
  const current = screen.getByRole('button', { name: /1:48/ });
  expect(current).toHaveAttribute('aria-current', 'true');
  await userEvent.click(screen.getByRole('button', { name: /0:00/ }));
  expect(onSeek).toHaveBeenCalledWith(0);
});
