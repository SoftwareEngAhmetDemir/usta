import { useEffect, useRef, useState } from 'react';
import type { Clip } from '../types';

// WebM first: Chrome on Android cut its MP4 recordings after 2-3 s (and so nearly silent), seen 2026-11-26.
// MP4 only where WebM is missing (older iPhone Safari); the backend transcodes either.
const TYPES = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
// ~1.6 Mbit/s in all (Chrome's default is ~2.5): 25 min ≈ 300 MB, held in phone memory until "Kaydet".
// shortcut: the whole clip stays in memory and goes up in one request; for videos over ~25 min upload in pieces.
export const RECORDING_BITS = { videoBitsPerSecond: 1_500_000, audioBitsPerSecond: 96_000 };
const pickType = () => TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';

/** Record from a camera stream, or take a video picked from the phone (KAN-36). */
export function useRecorder(stream: MediaStream | null) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<Clip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stopping = useRef(false);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip.url); }, [clip]);

  function start() {
    if (!stream) return;
    const type = pickType();
    const rec = new MediaRecorder(stream, { ...RECORDING_BITS, ...(type ? { mimeType: type } : {}) });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onerror = () => setError('Kayıt sırasında bir hata oldu. Tekrar deneyin veya telefondan video seçin.');
    rec.onstop = () => {
      // The browser stopped it on its own (camera lost, encoder failure): say so instead of a silently short clip.
      if (!stopping.current) setError('Kayıt kendiliğinden durdu. Kaydedilen kısmı kontrol edin veya tekrar çekin.');
      setRecording(false);
      const blob = new Blob(chunks, { type: rec.mimeType || type || 'video/webm' });
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      setClip({ blob, url: URL.createObjectURL(blob), fileName: `kayit.${ext}` });
    };
    recorder.current = rec;
    stopping.current = false;
    setError(null);
    rec.start(1000);
    setSeconds(0);
    setRecording(true);
  }

  function stop() {
    stopping.current = true;
    recorder.current?.stop();
    setRecording(false);
  }

  function pick(file: File) {
    if (!file.type.startsWith('video/')) return setError('Bu dosya video değil. Telefonunuzdan bir video seçin.');
    setError(null);
    setClip({ blob: file, url: URL.createObjectURL(file), fileName: file.name });
  }

  return { recording, seconds, clip, error, start, stop, pick, discard: () => setClip(null) };
}
