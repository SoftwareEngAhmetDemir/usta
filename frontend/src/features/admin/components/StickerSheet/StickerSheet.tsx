import type { AdminMachineRow } from '../../../../api';
import { qrImageUrl } from '../../api';
import { useT } from '../../../../i18n';

interface StickerSheetProps {
  machines: AdminMachineRow[];
  /** Machines left off the print / PDF. */
  excluded: ReadonlySet<number>;
  onToggle: (machineId: number) => void;
}

/** Sticker preview: machine name + QR + code, each with a "print" tick. QR images come from the backend (KAN-29, KAN-30). */
export function StickerSheet({ machines, excluded, onToggle }: StickerSheetProps) {
  const t = useT();
  return (
    <div className="labels">
      {machines.map((m) => (
        <div key={m.id} className={excluded.has(m.id) ? 'label-card no-print' : 'label-card'}>
          <label className="row no-print">
            <input type="checkbox" aria-label={`${m.name} ${t('yazdır')}`} checked={!excluded.has(m.id)} onChange={() => onToggle(m.id)} />
            {t('Yazdır')}
          </label>
          <img src={qrImageUrl(m.id)} alt={`${m.name} ${t('QR kodu')}`} />
          <b>{m.name}</b>
          <code>{m.code}{' '}{t('· /m/')}{m.id}</code>
        </div>
      ))}
    </div>
  );
}
