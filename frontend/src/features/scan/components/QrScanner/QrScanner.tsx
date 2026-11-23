import { useQrScanner } from '../../hooks/useQrScanner';
import { useT } from '../../../../i18n';

/** Live camera that reads the machine QR; explains when the camera can't be used here. */
export function QrScanner({ onCode }: { onCode: (text: string) => void }) {
  const t = useT();
  const { video, error } = useQrScanner(onCode);
  return (
    <div className="scanner">
      {error ? (
        <div className="viewfinder" aria-hidden="true">⌁</div>
      ) : (
        <video ref={video} className="viewfinder" aria-label={t('QR kamerası')} autoPlay muted playsInline />
      )}
      <div>
        <b>{t('Makinedeki QR’ı kameraya gösterin')}</b>
        <br />
        <span style={{ opacity: 0.75, fontSize: 14 }}>{t(error ?? 'QR okununca makine sayfası açılır.')}</span>
      </div>
    </div>
  );
}
