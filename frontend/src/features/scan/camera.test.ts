import { vi } from 'vitest';
import { cameraRefused, currentCamera, keepFocusing, mainBackCamera, startCamera } from './camera';

/** A video showing one camera track with these capabilities. */
function videoWith(track: Partial<MediaStreamTrack>) {
  const video = document.createElement('video');
  Object.defineProperty(video, 'srcObject', { value: { getVideoTracks: () => [track] } });
  return video;
}

describe('mainBackCamera', () => {
  it('picks the lowest-numbered back lens on Android (the main one, not ultra-wide or macro)', () => {
    const samsung = [
      { id: 'front', label: 'camera2 1, facing front' },
      { id: 'wide', label: 'camera2 2, facing back' },
      { id: 'main', label: 'camera2 0, facing back' },
      { id: 'macro', label: 'camera2 3, facing back' },
    ];
    expect(mainBackCamera(samsung)).toBe('main');
  });

  it('leaves the choice to the browser when labels have another shape (iPhone) or are empty', () => {
    expect(mainBackCamera([{ id: 'a', label: 'Back Camera' }, { id: 'b', label: 'Back Ultra Wide Camera' }])).toBeNull();
    expect(mainBackCamera([{ id: 'a', label: '' }])).toBeNull();
  });
});

describe('camera track helpers', () => {
  it('reads the camera the video shows', () => {
    expect(currentCamera(videoWith({ getSettings: () => ({ deviceId: 'main' }) }))).toBe('main');
    expect(currentCamera(document.createElement('video'))).toBeNull();
  });

  it('turns on continuous focus where the lens offers it', async () => {
    const applyConstraints = vi.fn(async () => undefined);
    await keepFocusing(videoWith({ getCapabilities: () => ({ focusMode: ['manual', 'continuous'] }) as MediaTrackCapabilities, applyConstraints }));
    expect(applyConstraints).toHaveBeenCalledWith({ advanced: [{ focusMode: 'continuous' }] });
  });

  it('leaves a lens without continuous focus alone', async () => {
    const applyConstraints = vi.fn(async () => undefined);
    await keepFocusing(videoWith({ getCapabilities: () => ({ focusMode: ['manual'] }) as MediaTrackCapabilities, applyConstraints }));
    await keepFocusing(videoWith({ getCapabilities: () => ({}), applyConstraints }));
    expect(applyConstraints).not.toHaveBeenCalled();
  });
});

describe('startCamera', () => {
  const busy = 'Camera not found.'; // what qr-scanner throws whatever went wrong

  it('tries again while the camera is still busy (Android, right after the scan page was left)', async () => {
    const start = vi.fn().mockRejectedValueOnce(busy).mockRejectedValueOnce(busy).mockResolvedValue(undefined);
    await startCamera(start, () => false, 4, 1);
    expect(start).toHaveBeenCalledTimes(3);
  });

  it('gives up after the last try', async () => {
    const start = vi.fn().mockRejectedValue(busy);
    await expect(startCamera(start, () => false, 3, 1)).rejects.toBe(busy);
    expect(start).toHaveBeenCalledTimes(3);
  });

  it('never retries a refusal, nor after the page is gone', async () => {
    const refused = vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError'));
    await expect(startCamera(refused, () => false, 4, 1)).rejects.toBeInstanceOf(DOMException);
    expect(refused).toHaveBeenCalledTimes(1);
    const left = vi.fn().mockRejectedValue(busy);
    await expect(startCamera(left, () => true, 4, 1)).rejects.toBe(busy);
    expect(left).toHaveBeenCalledTimes(1);
  });

  it('reads a refusal hidden behind the library message from the permission state', async () => {
    vi.stubGlobal('navigator', { ...navigator, permissions: { query: async () => ({ state: 'denied' }) } });
    expect(await cameraRefused(busy)).toBe(true);
    vi.stubGlobal('navigator', { ...navigator, permissions: { query: async () => ({ state: 'granted' }) } });
    expect(await cameraRefused(busy)).toBe(false);
  });
});
