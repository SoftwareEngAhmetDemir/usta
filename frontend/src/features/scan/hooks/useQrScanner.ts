import { useEffect, useRef, useState } from 'react';

// BarcodeDetector is not in lib.dom yet. Chrome/Edge on Android have it; iPhone Safari does not.
interface Detector { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> }
type DetectorClass = new (options: { formats: string[] }) => Detector;

/** Why the in-page scanner can't run here, or null when it can. */
export function scanUnavailable(): string | null {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
    return 'Kamera yalnızca güvenli (https) bağlantıda açılır. Uygulamayı https adresinden açın ya da QR’ı telefonun kendi kamerasıyla okutun.';
  if (!('BarcodeDetector' in window)) return 'Bu tarayıcı QR okuyamıyor. QR’ı telefonun kendi kamerasıyla okutun.';
  return null;
}

function cameraError(e: unknown): string {
  if (e instanceof DOMException && e.name === 'NotAllowedError') return 'Kamera izni verilmedi. Tarayıcı ayarlarından izin verin.';
  return 'Kamera açılamadı. Makine kodunu aşağıya yazabilirsiniz.';
}

/** Back camera into `video`; calls onCode with each new QR text it reads (KAN-29). */
export function useQrScanner(onCode: (text: string) => void) {
  const video = useRef<HTMLVideoElement>(null);
  const [unavailable] = useState(scanUnavailable);
  const [error, setError] = useState<string | null>(null);
  const handler = useRef(onCode);
  useEffect(() => { handler.current = onCode; }, [onCode]);

  useEffect(() => {
    if (unavailable) return;
    const Ctor = (window as Window & { BarcodeDetector?: DetectorClass }).BarcodeDetector;
    if (!Ctor) return;
    const detector = new Ctor({ formats: ['qr_code'] });
    let stream: MediaStream | null = null;
    let timer = 0;
    let last = '';
    let stopped = false;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((s) => {
      stream = s;
      const v = video.current;
      if (stopped || !v) return void s.getTracks().forEach((t) => t.stop());
      v.srcObject = s;
      void v.play().catch(() => undefined); // autoplay is muted + inline, so this only fails if the page is hidden
      timer = window.setInterval(async () => {
        if (!v.videoWidth) return;
        const [code] = await detector.detect(v).catch(() => []);
        if (code && code.rawValue !== last) handler.current((last = code.rawValue));
      }, 300);
    }, (e: unknown) => setError(cameraError(e)));

    return () => {
      stopped = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [unavailable]);

  return { video, error: unavailable ?? error };
}
