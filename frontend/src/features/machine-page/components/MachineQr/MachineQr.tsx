import { SectionTitle } from '../../../../components/SectionTitle';
import { machineQrUrl, machineStickerUrl } from '../../api';
import { useT } from '../../../../i18n';

/** The machine's QR and a one-sticker PDF to print, for its ustas and the patron (KAN-29, KAN-30). */
export function MachineQr({ machineId, name }: { machineId: number; name: string }) {
  const t = useT();
  return (
    <section aria-labelledby="qr-title">
      <SectionTitle id="qr-title" title={t('QR kodu')} />
      <div className="card row wrap">
        <img src={machineQrUrl(machineId)} alt={`${name} ${t('QR kodu')}`} width={120} height={120} />
        <a className="btn" data-size="small" href={machineStickerUrl(machineId)} target="_blank" rel="noreferrer">
          {t('Etiketi yazdır (PDF)')}
        </a>
      </div>
    </section>
  );
}
