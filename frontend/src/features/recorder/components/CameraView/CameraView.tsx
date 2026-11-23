import { useEffect, useRef } from 'react';
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
    return <div className="cam"><video key={previewUrl} src={previewUrl} controls playsInline aria-label={t('Kaydın önizlemesi')} /></div>;
  }
  return (
    <div className="cam">
      {stream ? <video ref={ref} autoPlay muted playsInline aria-label={t('Kamera görüntüsü')} /> : <span style={{ opacity: 0.7 }}>{t('Kamera kapalı')}</span>}
      {recordingSec !== null && <div className="rec" role="timer"><i aria-hidden="true" />{t('REC')}{' '}{formatDuration(recordingSec)}</div>}
    </div>
  );
}
