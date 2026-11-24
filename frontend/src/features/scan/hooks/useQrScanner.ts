import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { installZxing } from '../zxing';
import { cameraRefused, currentCamera, keepFocusing, mainBackCamera, startCamera } from '../camera';

/** Why the live camera can't run here, or null when it can. A photo (`readPhoto`) still works then. */
export function scanUnavailable(): string | null {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
    return 'Canlı kamera yalnızca https bağlantıda açılır. Aşağıdan QR’ın fotoğrafını çekin ya da uygulamayı https adresinden açın.';
  return null;
}

async function cameraError(e: unknown): Promise<string> {
  if (await cameraRefused(e)) return 'Kamera izni verilmedi. Tarayıcı ayarlarından izin verin ya da QR’ın fotoğrafını çekin.';
  return 'Kamera açılamadı. Başka bir uygulama kullanıyorsa kapatıp tekrar deneyin ya da QR’ın fotoğrafını çekin.';
}

export const NO_QR_IN_PHOTO = 'Fotoğrafta QR bulunamadı. QR’ı yakından ve net çekip tekrar deneyin.';

/** Scan the whole centre square (what the viewfinder shows) at full HD detail: a printed sticker held at focus
 * distance is small in the frame, and the library's default (2/3 of it, shrunk to 400 px) loses its squares. */
function viewfinder(v: HTMLVideoElement): QrScanner.ScanRegion {
  const side = Math.min(v.videoWidth, v.videoHeight);
  const size = Math.min(side, 1080);
  return { x: (v.videoWidth - side) / 2, y: (v.videoHeight - side) / 2, width: side, height: side, downScaledWidth: size, downScaledHeight: size };
}

export type ScanStatus = 'starting' | 'scanning' | 'off';

/** The QR just read is ignored this long (it stays in view for many frames), counted again from when scanning
 * resumes (the "not found" dialog closed): time to aim at the next QR, and the same one still gets an answer. */
export const SAME_QR_PAUSE_MS = 2000;

/** Back camera into `video` via qr-scanner; calls onCode with each QR text it reads, not while `paused`, and the
 * same text again only after `SAME_QR_PAUSE_MS` (KAN-29). */
export function useQrScanner(onCode: (text: string) => void, paused = false) {
  const video = useRef<HTMLVideoElement>(null);
  const [unavailable] = useState(scanUnavailable);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatus>(unavailable ? 'off' : 'starting');
  const [notice, setNotice] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ on: boolean; toggle: () => void } | null>(null);
  const [attempt, setAttempt] = useState(0); // "Kamerayı yeniden aç" starts the camera again without a page reload
  const handler = useRef(onCode);
  const hold = useRef(paused);
  const lastRead = useRef({ text: '', at: 0 });
  useEffect(() => {
    handler.current = onCode;
    if (hold.current && !paused) lastRead.current.at = Date.now(); // resumed: the grace period starts now
    hold.current = paused;
  }, [onCode, paused]);

  useEffect(() => {
    const v = video.current;
    if (unavailable || !v) return;
    let scanner: QrScanner | null = null;
    let seen: IntersectionObserver | null = null;
    let stopped = false;

    void installZxing().then(() => {
      if (stopped) return;
      const s = new QrScanner(v, ({ data }) => {
        const now = Date.now();
        if (hold.current || !data || (data === lastRead.current.text && now - lastRead.current.at < SAME_QR_PAUSE_MS)) return;
        lastRead.current = { text: data, at: now };
        navigator.vibrate?.(80);
        handler.current(data);
      }, { preferredCamera: 'environment', calculateScanRegion: viewfinder, highlightCodeOutline: true, maxScansPerSecond: 8, returnDetailedScanResult: true, onDecodeError: () => undefined });
      scanner = s;
      // Under the language skeleton the page is display:none and its video gets no frames (phones): start once on screen.
      seen = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        seen?.disconnect();
        startCamera(() => s.start(), () => stopped).then(async () => {
          setStatus('scanning');
          // Labels are readable once the camera is allowed; switching restarts the stream on the main lens.
          const main = mainBackCamera(await QrScanner.listCameras(true).catch(() => []));
          if (main && main !== currentCamera(v)) await s.setCamera(main).catch(() => undefined);
          if (stopped) return;
          await keepFocusing(v);
          if (!(await s.hasFlash())) return;
          const toggle = () => void s.toggleFlash().then(() => setFlash({ on: s.isFlashOn(), toggle }));
          setFlash({ on: false, toggle });
        }, async (e: unknown) => {
          const message = await cameraError(e);
          if (stopped) return;
          setStatus('off');
          setError(message);
        });
      });
      seen.observe(v);
    });
    return () => {
      stopped = true;
      seen?.disconnect();
      void scanner?.pause(true); // let go of the camera now: the library waits 300 ms, and coming back sooner found it busy
      scanner?.destroy();
    };
  }, [unavailable, attempt]);

  const retry = () => {
    setError(null);
    setFlash(null);
    setStatus('starting');
    setAttempt((n) => n + 1);
  };

  /** A photo from the phone's own camera app: focused and full resolution, and no https needed. */
  async function readPhoto(file: File) {
    setNotice(null);
    await installZxing();
    const photo = await createImageBitmap(file).catch(() => null);
    let text: string | null = null;
    if (photo) {
      const scale = Math.min(1, 1600 / Math.max(photo.width, photo.height)); // the library's default is 400 px
      const scanRegion = { downScaledWidth: Math.round(photo.width * scale), downScaledHeight: Math.round(photo.height * scale) };
      text = await QrScanner.scanImage(photo, { scanRegion, alsoTryWithoutScanRegion: true, returnDetailedScanResult: true }).then((r) => r.data, () => null);
      photo.close();
    }
    if (text) handler.current(text);
    else setNotice(NO_QR_IN_PHOTO);
  }

  return { video, status, error: unavailable ?? error, notice, flash, readPhoto, retry: unavailable ? null : retry };
}
