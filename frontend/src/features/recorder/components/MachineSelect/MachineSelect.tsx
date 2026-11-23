import type { Machine } from '../../../../api';
import { Field } from '../../../../components/Field';
import { useT } from '../../../../i18n';

type Option = Pick<Machine, 'id' | 'code' | 'name'>;

export function MachineSelect({ machines, value, onChange }: { machines: Option[]; value: number | null; onChange: (id: number) => void }) {
  const t = useT();
  if (machines.length === 0) {
    return (
      <div className="alert-error" role="alert">
        {t('Size atanmış makine yok. Video kaydetmek için patronun sizi bir makineye usta olarak eklemesi gerekir.')}
      </div>
    );
  }
  return (
    <Field label={t('Makine')} htmlFor="rec-machine">
      <select id="rec-machine" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
        {value === null && <option value="">{t('Makine seçin')}</option>}
        {machines.map((m) => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}
      </select>
    </Field>
  );
}
