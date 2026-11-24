import { useLocation, useNavigate } from 'react-router';
import type { MachineIn } from '../../api';
import { useAction } from '../../api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Notice } from '../../components/Notice';
import { PageTitle } from '../../components/PageTitle';
import { createMachine } from './api';
import { MachineForm } from './components/MachineForm';
import { readNewMachineFrom } from './from';
import { useQrCode } from './hooks/useQrCode';
import { useT } from '../../i18n';

/** Usta or patron adds a machine, then lands on its page; an usta becomes its usta (KAN-27). Opened from the scan
 * page for an unknown QR, the machine keeps that QR, so scanning it later opens this machine. */
export function NewMachinePage() {
  const t = useT();
  const navigate = useNavigate();
  const create = useAction(createMachine);
  const from = readNewMachineFrom(useLocation().state);
  const qrCode = useQrCode(from.qr);

  async function submit(body: MachineIn) {
    const m = await create.run(from.qr ? { ...body, qr_text: from.qr } : body);
    if (m) navigate(`/m/${m.id}`, { replace: Boolean(from.qr || from.code) }); // back goes to the scanner, not this form
  }

  return (
    <>
      <PageTitle title={t('Makine ekle')} />
      {from.qr && (
        <Notice tone="info" title={t('Taranan QR bu makineye bağlanacak')}>
          <code dir="ltr" className="line-clamp-2 break-all font-mono text-foreground">{from.qr}</code>
          {t('Makineyi ekledikten sonra bu QR okutulunca makinenin sayfası açılır.')}
        </Notice>
      )}
      <MachineForm initialCode={from.code} lockedCode={qrCode} pending={create.pending} onSubmit={(b) => void submit(b)} />
      <ErrorMessage error={create.error} />
    </>
  );
}
