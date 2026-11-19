import { useEffect, useRef, useState } from 'react';
import type { Clip } from '../types';

const TYPES = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'];
const pickType = () => TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';

/** Record from a camera stream, or take a video picked from the phone (KAN-36). */
export function useRecorder(stream: MediaStream | null) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<Clip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip.url); }, [clip]);

  function start() {
    if (!stream) return;
    const type = pickType();
    const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || type || 'video/webm' });
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      setClip({ blob, url: URL.createObjectURL(blob), fileName: `kayit.${ext}` });
    };
    recorder.current = rec;
    rec.start(1000);
    setSeconds(0);
    setRecording(true);
  }

  function stop() {
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
