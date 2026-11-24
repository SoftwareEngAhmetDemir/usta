import { vi } from 'vitest';

/** What the fake camera sees, what a photo holds and whether it has a torch; set through `stubQrCamera` / in tests. */
export const fakeQr = {
  live: null as string | null,
  photo: null as string | null,
  torch: false,
  cameras: [] as { id: string; label: string }[],
  /** Each `setCamera` the scanner made. */
  switchedTo: [] as string[],
  /** How often the camera was let go of at once (`pause(true)`). */
  releasedNow: 0,
};

interface Result { data: string }

/** Stand-in for qr-scanner (jsdom has no camera, canvas or worker): opens the camera through getUserMedia,
 * then reports `fakeQr.live` every 100 ms, like the library calling onDecode for each decoded frame. */
export default class FakeQrScanner {
  static scanImage = vi.fn(async (): Promise<Result> => {
    if (fakeQr.photo) return { data: fakeQr.photo };
    throw new Error('No QR code found');
  });

  private timer = 0;
  private flashOn = false;
  private readonly onDecode: (r: Result) => void;
  constructor(_video: HTMLVideoElement, onDecode: (r: Result) => void) { this.onDecode = onDecode; }

  async start() {
    await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    this.timer = window.setInterval(() => { if (fakeQr.live) this.onDecode({ data: fakeQr.live }); }, 100);
  }

  static listCameras = vi.fn(async () => fakeQr.cameras);
  async setCamera(id: string) { fakeQr.switchedTo.push(id); }

  async hasFlash() { return fakeQr.torch; }
  async toggleFlash() { this.flashOn = !this.flashOn; }
  isFlashOn() { return this.flashOn; }

  async pause(stopStreamImmediately = false) { if (stopStreamImmediately) fakeQr.releasedNow += 1; return true; }
  destroy() { window.clearInterval(this.timer); }
}
