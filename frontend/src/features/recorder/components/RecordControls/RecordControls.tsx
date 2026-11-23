import { Camera, SwitchCamera } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { Chip } from '../../../../components/Chip';
import { useT } from '../../../../i18n';

interface Props {
  cameraOn: boolean;
  recording: boolean;
  onOpenCamera: () => void;
  onStart: () => void;
  onStop: () => void;
  onFlip: () => void;
  onPick: (file: File) => void;
}

const shutter = 'mx-auto grid size-[76px] place-items-center rounded-full border-[5px] border-white bg-red-600 shadow-[0_0_0_2px_var(--border)] transition-transform active:scale-95';

/** One big record/stop button; or open the camera / choose a video from the phone. */
export function RecordControls({ cameraOn, recording, onOpenCamera, onStart, onStop, onFlip, onPick }: Props) {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3">
      {!cameraOn && (
        <>
          <p className="m-0 text-center text-sm text-muted-foreground">{t('Video çekmek için kamera ve mikrofon izni istenecek.')}</p>
          <Button onClick={onOpenCamera}><Camera aria-hidden="true" />{t('Kamerayı aç')}</Button>
        </>
      )}
      {cameraOn && !recording && <button type="button" className={shutter} aria-label={t('Kaydı başlat')} onClick={onStart} />}
      {recording && (
        <button type="button" className={shutter} aria-label={t('Kaydı durdur')} onClick={onStop}>
          <span className="size-7 rounded-md bg-white" aria-hidden="true" />
        </button>
      )}
      {cameraOn && !recording && <Chip onClick={onFlip}><SwitchCamera aria-hidden="true" />{t('Kamerayı çevir')}</Chip>}
      {!recording && (
        <label className="cursor-pointer text-center text-sm text-muted-foreground">
          {t('veya')} <u className="font-medium text-steel">{t('telefondan video seç')}</u>
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
            }}
          />
        </label>
      )}
    </div>
  );
}
