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

/** One big record/stop button; or open the camera / choose a video from the phone. */
export function RecordControls({ cameraOn, recording, onOpenCamera, onStart, onStop, onFlip, onPick }: Props) {
  const t = useT();
  return (
    <div className="stack" style={{ alignItems: 'center' }}>
      {!cameraOn && (
        <>
          <p className="muted" style={{ margin: 0, textAlign: 'center' }}>{t('Video çekmek için kamera ve mikrofon izni istenecek.')}</p>
          <button type="button" className="btn" onClick={onOpenCamera}>{t('📷 Kamerayı aç')}</button>
        </>
      )}
      {cameraOn && !recording && <button type="button" className="shutter" aria-label={t('Kaydı başlat')} onClick={onStart} />}
      {recording && <button type="button" className="shutter stop" aria-label={t('Kaydı durdur')} onClick={onStop} />}
      {cameraOn && !recording && <button type="button" className="chip" onClick={onFlip}>{t('🔄 Kamerayı çevir')}</button>}
      {!recording && (
        <label className="muted" style={{ textAlign: 'center' }}>
          {t('veya')}{' '}<u>{t('telefondan video seç')}</u>
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
