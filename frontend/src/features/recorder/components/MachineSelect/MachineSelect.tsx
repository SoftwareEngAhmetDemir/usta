import type { Machine } from '../../../../api';
import { Field } from '../../../../components/Field';

type Option = Pick<Machine, 'id' | 'code' | 'name'>;

export function MachineSelect({ machines, value, onChange }: { machines: Option[]; value: number | null; onChange: (id: number) => void }) {
  if (machines.length === 0) {
    return (
      <div className="alert-error" role="alert">
        Size atanmış makine yok. Video kaydetmek için patronun sizi bir makineye usta olarak eklemesi gerekir.
      </div>
    );
  }
  return (
    <Field label="Makine" htmlFor="rec-machine">
      <select id="rec-machine" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
        {value === null && <option value="">Makine seçin</option>}
        {machines.map((m) => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}
      </select>
    </Field>
  );
}
