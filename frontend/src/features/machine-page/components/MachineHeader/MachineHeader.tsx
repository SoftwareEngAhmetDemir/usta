import type { Machine } from '../../../../api';
import { useT } from '../../../../i18n';

export function MachineHeader({ machine }: { machine: Machine }) {
  const t = useT();
  return (
    <section className="card mhead" aria-label={t('Makine bilgileri')}>
      <div className="ph">{machine.photo_url ? <img src={machine.photo_url} alt={machine.name} /> : machine.code}</div>
      <div className="grow">
        <h2>{machine.name}</h2>
        <dl className="kv">
          <dt>{t('Tür')}</dt><dd>{machine.type}</dd>
          <dt>{t('Model')}</dt><dd>{machine.model}</dd>
          <dt>{t('Seri no')}</dt><dd>{machine.serial}</dd>
          <dt>{t('Konum')}</dt><dd>{machine.location}</dd>
        </dl>
      </div>
    </section>
  );
}
