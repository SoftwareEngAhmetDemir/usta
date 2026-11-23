import { Printer } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { SectionTitle } from '../../../../components/SectionTitle';
import { Card } from '../../../../components/ui/card';
import { machineQrUrl, machineStickerUrl } from '../../api';
import { useT } from '../../../../i18n';

/** The machine's QR and a one-sticker PDF to print, for its ustas and the patron (KAN-29, KAN-30). */
export function MachineQr({ machineId, name }: { machineId: number; name: string }) {
  const t = useT();
  return (
    <section aria-labelledby="qr-title" className="flex flex-col gap-2">
      <SectionTitle id="qr-title" title={t('QR kodu')} />
      <Card className="flex-row flex-wrap items-center gap-4">
        <img src={machineQrUrl(machineId)} alt={`${name} ${t('QR kodu')}`} width={120} height={120} className="rounded-lg border bg-white p-1.5" />
        <Button asChild size="small" variant="secondary">
          <a href={machineStickerUrl(machineId)} target="_blank" rel="noreferrer"><Printer aria-hidden="true" />{t('Etiketi yazdır (PDF)')}</a>
        </Button>
      </Card>
    </section>
  );
}
