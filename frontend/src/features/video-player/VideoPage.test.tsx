import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { me, videoDetail } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { VideoPage } from './VideoPage';

const show = (url = '/videos/1') => renderAuthed(<VideoPage />, url, '/videos/:videoId');
const openSettings = async () => userEvent.click(await screen.findByRole('button', { name: 'Video ayarları' }));
/** Gear → "Altyazılar" / "Ses dili" → a language, like a viewer does. */
async function pickFrom(menu: 'Altyazılar' | 'Ses dili', option: string | RegExp) {
  await openSettings();
  await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${menu}`) }));
  await userEvent.click(screen.getByRole('button', { name: option }));
}
const preparing = {
  ...videoDetail,
  default_audio_language: 'tr',
  preparation: { language: 'ar', language_name: 'العربية', steps: [{ key: 'translate', label: 'Çeviri', status: 'running' }] },
};

describe('VideoPage', () => {
  it('opens at the given second with the default tracks (KAN-38, KAN-61)', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /videos/1': { ...videoDetail, default_audio_language: 'en' } });
    show('/videos/1?t=108');
    const video = await screen.findByLabelText<HTMLVideoElement>('Meme ve elektrot değişimi');
    expect(video).toHaveAttribute('src', '/uploads/videos/1/en.mp4');
    expect(video.currentTime).toBe(108);
    expect(screen.getByRole('link', { name: 'Plazma Kesim Makinesi' })).toHaveAttribute('href', '/m/1');
  });

  it('defaults both menus to the site language and asks for it once when nobody has prepared it', async () => {
    const prep = { language: 'ar', language_name: 'العربية', steps: [{ key: 'translate', label: 'Çeviri', status: 'running' }] };
    const { calls } = mockApi({
      'GET /auth/me': me('worker', 'ar'),
      'GET /videos/1': { ...videoDetail, default_subtitle_language: 'ar', default_audio_language: 'ar' },
      'POST /videos/1/languages/ar': prep,
    });
    show();
    await openSettings();
    expect(screen.getByRole('button', { name: /^Altyazılar/ })).toHaveTextContent('العربية');
    expect(screen.getByRole('button', { name: /^Ses dili/ })).toHaveTextContent('العربية');
    expect(screen.getByLabelText('Meme ve elektrot değişimi')).toHaveAttribute('src', '/uploads/videos/1/original.mp4'); // until ready
    await waitFor(() => expect(calls.filter((c) => c.method === 'POST' && c.path === '/videos/1/languages/ar')).toHaveLength(1));
  });

  it('turns subtitles off and back on with the CC button on the player', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /videos/1': { ...videoDetail, default_subtitle_language: 'en' } });
    show();
    const cc = await screen.findByRole('button', { name: 'Altyazı (CC)' });
    expect(cc).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(cc);
    expect(cc).toHaveAttribute('aria-pressed', 'false');
    await openSettings();
    expect(screen.getByRole('button', { name: /^Altyazılar/ })).toHaveTextContent('Kapalı');
    await userEvent.click(cc);
    expect(cc).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches audio to another stored language (KAN-56)', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /videos/1': videoDetail });
    show();
    await pickFrom('Ses dili', /^English/);
    expect(screen.getByLabelText('Meme ve elektrot değişimi')).toHaveAttribute('src', '/uploads/videos/1/en.mp4');
  });

  it('keeps checking a language picked from the menu and plays it once it is ready', async () => {
    const [tr, en, ar] = videoDetail.tracks;
    const withArabic = (audio: 'none' | 'preparing' | 'ready') => ({
      ...videoDetail,
      tracks: [tr, en, { ...ar!, audio, stream_url: audio === 'ready' ? '/uploads/videos/1/ar.mp4' : null }],
    });
    let arabic: 'none' | 'preparing' | 'ready' = 'none';
    mockApi({
      'GET /auth/me': me('worker'),
      'GET /videos/1': () => withArabic(arabic),
      'POST /videos/1/languages/ar': () => { arabic = 'preparing'; return preparing.preparation; },
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      show();
      await pickFrom('Ses dili', /^العربية · iste/);
      await openSettings();
      await userEvent.click(screen.getByRole('button', { name: /^Ses dili/ }));
      expect(await screen.findByRole('button', { name: /^العربية · hazırlanıyor/ })).toBeDisabled();
      arabic = 'ready'; // the backend finished; the page must notice without a reload
      await vi.advanceTimersByTimeAsync(3000);
      await waitFor(() => expect(screen.getByLabelText('Meme ve elektrot değişimi')).toHaveAttribute('src', '/uploads/videos/1/ar.mp4'));
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows preparation progress, retries a step and requests a missing language (KAN-55)', async () => {
    const { calls } = mockApi({
      'GET /auth/me': me('worker', 'ar'),
      'GET /videos/1': { ...preparing, preparation: { ...preparing.preparation, steps: [{ key: 'dub', label: 'Dublaj', status: 'failed' }] } },
      'POST /videos/1/languages/ar/steps/dub/retry': preparing.preparation,
      'POST /videos/1/languages/ar': preparing.preparation,
    });
    show();
    expect(await screen.findByText('Bu video العربية hazırlanıyor')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }));
    await waitFor(() => expect(calls.some((c) => c.path === '/videos/1/languages/ar/steps/dub/retry')).toBe(true));
    await pickFrom('Altyazılar', /^العربية · iste/);
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/videos/1/languages/ar')).toBe(true));
  });
});
