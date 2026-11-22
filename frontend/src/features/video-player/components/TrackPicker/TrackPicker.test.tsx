import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { videoDetail } from '../../../../test/fixtures';
import { chooseFrom } from '../../../../test/utils';
import { TrackPicker } from './TrackPicker';

const persian = { ...videoDetail.tracks[1]!, language: 'fa', language_name: 'فارسی', language_tr_name: 'Farsça', audio: 'unavailable' as const, subtitles: 'none' as const, subtitle_url: null, stream_url: null };

function setup() {
  const fns = { onAudio: vi.fn(), onSubtitle: vi.fn(), onRequest: vi.fn() };
  const tracks = [...videoDetail.tracks.slice(0, 2), { ...videoDetail.tracks[2]!, subtitles: 'preparing' as const }, persian];
  render(<TrackPicker tracks={tracks} audio="tr" subtitle="en" {...fns} />);
  return fns;
}

const open = (label: string) => userEvent.click(screen.getByRole('button', { name: label }));

describe('TrackPicker', () => {
  it('shows the current choices, marks the original audio and what is still preparing', async () => {
    setup();
    expect(screen.getByRole('button', { name: 'Ses' })).toHaveTextContent('Türkçe (orijinal)');
    expect(screen.getByRole('button', { name: 'Altyazı' })).toHaveTextContent('English');
    await open('Altyazı');
    expect(screen.getByRole('option', { name: /^العربية · hazırlanıyor/ })).toHaveAttribute('aria-disabled', 'true');
  });

  it('leaves languages without a voice out of the audio list but offers their subtitles', async () => {
    setup();
    await open('Ses');
    expect(screen.queryByRole('option', { name: /فارسی/ })).toBeNull();
    await open('Ses');
    await open('Altyazı');
    expect(screen.getByRole('option', { name: /^فارسی · iste/ })).not.toHaveAttribute('aria-disabled');
  });

  it('finds a language by its Turkish name', async () => {
    setup();
    await open('Altyazı');
    await userEvent.type(screen.getByRole('combobox', { name: 'Altyazı: ara' }), 'farsca');
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('switches tracks, turns subtitles off and requests a missing language', async () => {
    const fns = setup();
    await chooseFrom('Ses', /^English/);
    expect(fns.onAudio).toHaveBeenCalledWith('en');
    await chooseFrom('Ses', /^العربية · iste/);
    expect(fns.onRequest).toHaveBeenCalledWith('ar', 'audio');
    await chooseFrom('Altyazı', 'Kapalı');
    expect(fns.onSubtitle).toHaveBeenCalledWith('off');
    await chooseFrom('Altyazı', /^فارسی · iste/);
    expect(fns.onRequest).toHaveBeenCalledWith('fa', 'subtitles');
  });
});
