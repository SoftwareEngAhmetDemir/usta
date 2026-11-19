import type { AdminMachineRow } from '../../../../api';
import { qrImageUrl } from '../../api';

/** Sticker preview: machine name + QR + code. The QR images come from the backend (KAN-29, KAN-30). */
export function StickerSheet({ machines }: { machines: AdminMachineRow[] }) {
  return (
    <div className="labels">
      {machines.map((m) => (
        <div key={m.id} className="label-card">
          <img src={qrImageUrl(m.id)} alt={`${m.name} QR kodu`} />
          <b>{m.name}</b>
          <code>{m.code} · /m/{m.id}</code>
        </div>
      ))}
    </div>
  );
}
