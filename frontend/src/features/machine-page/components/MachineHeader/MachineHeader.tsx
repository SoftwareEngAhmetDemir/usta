import type { Machine } from '../../../../api';
import { Card } from '../../../../components/ui/card';
import { useT } from '../../../../i18n';

export function MachineHeader({ machine }: { machine: Machine }) {
  const t = useT();
  const rows: [string, string][] = [[t('Tür'), machine.type], [t('Model'), machine.model], [t('Seri no'), machine.serial], [t('Konum'), machine.location]];
  return (
    <Card asChild className="flex-row gap-4"><section aria-label={t('Makine bilgileri')}>
      <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-[repeating-linear-gradient(135deg,var(--steel)_0_10px,#36536a_10px_20px)] p-1 text-center font-display text-xl font-bold text-primary">
        {machine.photo_url ? <img src={machine.photo_url} alt={machine.name} className="size-full rounded-lg object-cover" /> : machine.code}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="m-0 mb-1.5 text-lg leading-tight font-semibold">{machine.name}</h2>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="m-0 truncate font-mono text-[13px]">{v || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section></Card>
  );
}
