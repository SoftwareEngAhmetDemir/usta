import { CameraOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

const frame = 'relative grid aspect-[3/4] place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_40%_45%,#4c6577_0,#121a20_75%)] text-white shadow-md';
import { formatDuration } from '../../../../lib/format';
import { useT } from '../../../../i18n';

interface Props {
  stream: MediaStream | null;
  previewUrl: string | null; // set after recording: play the clip back
  recordingSec: number | null;
}

export function CameraView({ stream, previewUrl, recordingSec }: Props) {
  const t = useT();
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && !previewUrl) ref.current.srcObject = stream;
  }, [stream, previewUrl]);

  if (previewUrl) {
    return <div className={frame}><video key={previewUrl} className="size-full object-cover" src={previewUrl} controls playsInline aria-label={t('Kaydın önizlemesi')} /></div>;
  }
  return (
    <div className={frame}>
      {stream ? <video ref={ref} className="size-full object-cover" autoPlay muted playsInline aria-label={t('Kamera görüntüsü')} /> : (
        <span className="flex flex-col items-center gap-2 text-white/60"><CameraOff className="size-8" aria-hidden="true" />{t('Kamera kapalı')}</span>
      )}
      {recordingSec !== null && (
        <div className="absolute start-3 top-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-sm text-white" role="timer">
          <i className="size-2.5 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />{t('REC')} {formatDuration(recordingSec)}
        </div>
      )}
    </div>
  );
}
