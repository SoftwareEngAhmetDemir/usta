import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { videoDetail } from '../../../../test/fixtures';
import { TrackPicker } from './TrackPicker';

function setup() {
  const fns = { onAudio: vi.fn(), onSubtitle: vi.fn(), onRequest: vi.fn() };
  const tracks = [...videoDetail.tracks.slice(0, 2), { ...videoDetail.tracks[2]!, subtitles: 'preparing' as const }];
  render(<TrackPicker tracks={tracks} audio="tr" subtitle="en" {...fns} />);
  return fns;
}

describe('TrackPicker', () => {
  it('marks the original audio and the current choices', () => {
    setup();
    const audio = screen.getByRole('group', { name: 'Ses' });
    expect(within(audio).getByRole('button', { name: 'Türkçe (orijinal)' })).toHaveAttribute('aria-pressed', 'true');
    const subs = screen.getByRole('group', { name: 'Altyazı' });
    expect(within(subs).getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(subs).getByRole('button', { name: 'العربية · hazırlanıyor' })).toBeDisabled();
  });

  it('switches tracks, turns subtitles off and requests a missing language', async () => {
    const fns = setup();
    const audio = screen.getByRole('group', { name: 'Ses' });
    await userEvent.click(within(audio).getByRole('button', { name: 'English' }));
    expect(fns.onAudio).toHaveBeenCalledWith('en');
    await userEvent.click(within(audio).getByRole('button', { name: 'العربية · iste' }));
    expect(fns.onRequest).toHaveBeenCalledWith('ar');
    await userEvent.click(screen.getByRole('button', { name: 'Kapalı' }));
    expect(fns.onSubtitle).toHaveBeenCalledWith('off');
  });
});
