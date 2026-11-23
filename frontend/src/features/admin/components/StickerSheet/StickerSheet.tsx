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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
      {machines.map((m) => (
        <div
          key={m.id}
          data-excluded={excluded.has(m.id) || undefined}
          className="flex break-inside-avoid flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-input bg-white p-3 text-center transition-opacity data-excluded:opacity-45 data-excluded:print:hidden"
        >
          <label className="flex items-center gap-2 self-start text-sm print:hidden">
            <input type="checkbox" className="size-4 accent-steel" aria-label={`${m.name} ${t('yazdır')}`} checked={!excluded.has(m.id)} onChange={() => onToggle(m.id)} />
            {t('Yazdır')}
          </label>
          <img src={qrImageUrl(m.id)} alt={`${m.name} ${t('QR kodu')}`} className="size-[120px]" />
          <b className="font-display text-lg font-semibold uppercase">{m.name}</b>
          <code className="font-mono text-[11px] text-muted-foreground">{m.code} {t('· /m/')}{m.id}</code>
        </div>
      ))}
    </div>
  );
}
