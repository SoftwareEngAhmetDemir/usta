import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { videoDetail } from '../../../../test/fixtures';
import { PlayerSettings } from './PlayerSettings';

const persian = { ...videoDetail.tracks[1]!, language: 'fa', language_name: 'فارسی', language_tr_name: 'Farsça', audio: 'unavailable' as const, subtitles: 'none' as const, subtitle_url: null, stream_url: null };

function setup() {
  const fns = { onAudio: vi.fn(), onSubtitle: vi.fn(), onRequest: vi.fn() };
  const tracks = [...videoDetail.tracks.slice(0, 2), { ...videoDetail.tracks[2]!, subtitles: 'preparing' as const }, persian];
  render(<PlayerSettings tracks={tracks} audio="tr" subtitle="en" {...fns} />);
  return fns;
}

const click = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }));
async function pick(menu: RegExp, option: string | RegExp) {
  await click('Video ayarları');
  await click(menu);
  await click(option);
}

describe('PlayerSettings', () => {
  it('shows the current choices under the gear, marks the original audio and what is still preparing', async () => {
    setup();
    await click('Video ayarları');
    expect(screen.getByRole('dialog', { name: 'Video ayarları' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Ses dili/ })).toHaveTextContent('Türkçe (orijinal)');
    expect(screen.getByRole('button', { name: /^Altyazılar/ })).toHaveTextContent('English');
    await click(/^Altyazılar/);
    expect(screen.getByRole('button', { name: /^العربية · hazırlanıyor/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^English/ })).toHaveAttribute('aria-current', 'true');
  });

  it('leaves languages without a voice out of the audio list but offers their subtitles', async () => {
    setup();
    await click('Video ayarları');
    await click(/^Ses dili/);
    expect(screen.queryByRole('button', { name: /فارسی/ })).toBeNull();
    await click('Ses dili'); // back to the menu
    await click(/^Altyazılar/);
    expect(screen.getByRole('button', { name: /^فارسی · iste/ })).toBeEnabled();
  });

  it('finds a language by its Turkish name', async () => {
    setup();
    await click('Video ayarları');
    await click(/^Altyazılar/);
    await userEvent.type(screen.getByRole('textbox', { name: 'Altyazılar: ara' }), 'farsca');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('switches tracks, turns subtitles off, requests a missing language and closes', async () => {
    const fns = setup();
    await pick(/^Ses dili/, /^English/);
    expect(fns.onAudio).toHaveBeenCalledWith('en');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await pick(/^Ses dili/, /^العربية · iste/);
    expect(fns.onRequest).toHaveBeenCalledWith('ar', 'audio');
    await pick(/^Altyazılar/, 'Kapalı');
    expect(fns.onSubtitle).toHaveBeenCalledWith('off');
    await pick(/^Altyazılar/, /^فارسی · iste/);
    expect(fns.onRequest).toHaveBeenCalledWith('fa', 'subtitles');
  });

  it('closes with Escape', async () => {
    setup();
    await click('Video ayarları');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
