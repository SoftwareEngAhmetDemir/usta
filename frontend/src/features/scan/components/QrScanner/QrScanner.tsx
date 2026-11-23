import { ScanLine } from 'lucide-react';
import { useQrScanner } from '../../hooks/useQrScanner';
import { useT } from '../../../../i18n';

/** Live camera that reads the machine QR; explains when the camera can't be used here. */
export function QrScanner({ onCode }: { onCode: (text: string) => void }) {
  const t = useT();
  const { video, error } = useQrScanner(onCode);
  const frame = 'relative size-56 overflow-hidden rounded-2xl border-[3px] border-dashed border-primary bg-black';
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#10161b] px-5 py-6 text-center text-white shadow-lg">
      {error ? (
        <div className={`${frame} grid place-items-center`} aria-hidden="true"><ScanLine className="size-14 text-primary/80" /></div>
      ) : (
        <div className={frame}>
          <video ref={video} className="size-full object-cover" aria-label={t('QR kamerası')} autoPlay muted playsInline />
          <span className="absolute inset-x-6 top-1/2 h-0.5 bg-primary/80 shadow-[0_0_12px_var(--primary)] motion-safe:animate-pulse" aria-hidden="true" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <b className="text-lg">{t('Makinedeki QR’ı kameraya gösterin')}</b>
        <span className="text-sm text-white/70">{t(error ?? 'QR okununca makine sayfası açılır.')}</span>
      </div>
    </div>
  );
}
