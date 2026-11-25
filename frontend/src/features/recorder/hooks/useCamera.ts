import { useCallback, useEffect, useRef, useState } from 'react';

// 720p: sharp enough for labels and hands; with RECORDING_BITS (useRecorder) 25 min ≈ 300 MB.
export const HD = { width: { ideal: 1280 }, height: { ideal: 720 } };

export type Facing = 'environment' | 'user';

function cameraError(e: unknown): string {
  if (e instanceof DOMException && e.name === 'NotAllowedError') return 'Kamera veya mikrofon izni verilmedi. Tarayıcı ayarlarından izin verin.';
  if (e instanceof DOMException && e.name === 'NotFoundError') return 'Bu cihazda kamera bulunamadı.';
  return 'Kamera açılamadı. Videoyu telefondan seçebilirsiniz.';
}

/** Back camera by default, with a switch to the front camera (KAN-73). */
export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>('environment');
  const [error, setError] = useState<string | null>(null);
  const current = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    current.current?.getTracks().forEach((t) => t.stop());
    current.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async (face: Facing = 'environment') => {
    setError(null);
    current.current?.getTracks().forEach((t) => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face, ...HD }, audio: true });
      current.current = s;
      setFacing(face);
      setStream(s);
    } catch (e: unknown) {
      setError(cameraError(e));
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { stream, facing, error, start, stop, flip: () => start(facing === 'environment' ? 'user' : 'environment') };
}
