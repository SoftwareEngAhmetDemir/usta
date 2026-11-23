import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { videoDetail } from '../../../../test/fixtures';
import { Transcript } from './Transcript';

const show = (currentSec = 120, onSeek = vi.fn()) =>
  render(<Transcript segments={videoDetail.transcript} lang="tr" dir="ltr" currentSec={currentSec} onSeek={onSeek} />);
const toggle = () => screen.getByRole('button', { name: /Ustanın anlatımı/ });

it('Transcript starts folded, showing only the line being said now', () => {
  show();
  expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  expect(toggle()).toHaveTextContent('1:48'); // the line playing at 2:00
  expect(screen.queryByRole('button', { name: /^0:00/ })).not.toBeInTheDocument();
});

it('Transcript opens on tap, highlights the current line and seeks on tap', async () => {
  const onSeek = vi.fn();
  show(120, onSeek);
  await userEvent.click(toggle());
  expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: /^1:48/ })).toHaveAttribute('aria-current', 'true');
  await userEvent.click(screen.getByRole('button', { name: /^0:00/ }));
  expect(onSeek).toHaveBeenCalledWith(0);
  await userEvent.click(toggle());
  expect(screen.queryByRole('button', { name: /^0:00/ })).not.toBeInTheDocument();
});
