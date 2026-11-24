import { Camera, Flashlight, FlashlightOff, RotateCw, ScanLine } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { useQrScanner } from '../../hooks/useQrScanner';
import { useT } from '../../../../i18n';

const HINT = { starting: 'Kamera açılıyor…', scanning: 'QR’ı çerçevenin içine getirin, 20–30 cm uzaktan tutun. Karanlıksa feneri açın.', off: '' };

/** Live camera that reads the machine QR, plus a photo fallback (works on plain http and when focus fails). */
export function QrScanner({ onCode, paused = false }: { onCode: (text: string) => void; paused?: boolean }) {
  const t = useT();
  const { video, status, error, notice, flash, readPhoto, retry } = useQrScanner(onCode, paused);
  const frame = 'relative aspect-square w-full max-w-72 overflow-hidden rounded-2xl border-[3px] border-dashed border-primary bg-black';
  const message = notice ?? error ?? HINT[status];
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#10161b] px-5 py-6 text-center text-white shadow-lg">
      {error ? (
        <div className={`${frame} grid place-items-center`} aria-hidden="true"><ScanLine className="size-14 text-primary/80" /></div>
      ) : (
        <div className={frame}>
          <video ref={video} className="size-full object-cover" aria-label={t('QR kamerası')} autoPlay muted playsInline />
          {status === 'scanning' && <span className="absolute inset-x-6 top-1/2 h-0.5 bg-primary/80 shadow-[0_0_12px_var(--primary)] motion-safe:animate-scan" aria-hidden="true" />}
          {flash && (
            <button
              type="button" onClick={flash.toggle} aria-pressed={flash.on} aria-label={t('Fener')}
              className="absolute end-2 top-2 grid size-11 place-items-center rounded-full bg-black/60 text-white aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {flash.on ? <Flashlight aria-hidden="true" /> : <FlashlightOff aria-hidden="true" />}
            </button>
          )}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <b className="text-lg">{t('Makinedeki QR’ı kameraya gösterin')}</b>
        <output className={notice || error ? 'text-sm text-primary' : 'text-sm text-white/70'}>{message && t(message)}</output>
      </div>
      {error && retry && (
        <Button onClick={retry}><RotateCw aria-hidden="true" />{t('Kamerayı yeniden aç')}</Button>
      )}
      <Button asChild variant="secondary" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
        <label>
          <Camera aria-hidden="true" />
          {t('Fotoğraf çekerek oku')}
          <input
            type="file" accept="image/*" capture="environment" className="sr-only"
            onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void readPhoto(file); }}
          />
        </label>
      </Button>
    </div>
  );
}
