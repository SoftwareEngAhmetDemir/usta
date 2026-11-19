import type { Machine } from '../../../../api';

export function MachineHeader({ machine }: { machine: Machine }) {
  return (
    <section className="card mhead" aria-label="Makine bilgileri">
      <div className="ph">{machine.photo_url ? <img src={machine.photo_url} alt={machine.name} /> : machine.code}</div>
      <div className="grow">
        <h2>{machine.name}</h2>
        <dl className="kv">
          <dt>Tür</dt><dd>{machine.type}</dd>
          <dt>Model</dt><dd>{machine.model}</dd>
          <dt>Seri no</dt><dd>{machine.serial}</dd>
          <dt>Konum</dt><dd>{machine.location}</dd>
        </dl>
      </div>
    </section>
  );
}
