import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { me, videoDetail } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { VideoPage } from './VideoPage';

const show = (url = '/videos/1') => renderAuthed(<VideoPage />, url, '/videos/:videoId');
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

  it('switches audio to another stored language (KAN-56)', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /videos/1': videoDetail });
    show();
    const audio = await screen.findByRole('group', { name: 'Ses' });
    await userEvent.click(within(audio).getByRole('button', { name: 'English' }));
    expect(screen.getByLabelText('Meme ve elektrot değişimi')).toHaveAttribute('src', '/uploads/videos/1/en.mp4');
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
    await userEvent.click(within(screen.getByRole('group', { name: 'Altyazı' })).getByRole('button', { name: 'العربية · iste' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.path === '/videos/1/languages/ar')).toBe(true));
  });
});
