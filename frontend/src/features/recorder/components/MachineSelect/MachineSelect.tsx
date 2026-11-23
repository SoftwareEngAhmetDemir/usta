import type { Machine } from '../../../../api';
import { Field } from '../../../../components/Field';
import { Notice } from '../../../../components/Notice';
import { NativeSelect, NativeSelectOption } from '../../../../components/ui/native-select';
import { useT } from '../../../../i18n';

type Option = Pick<Machine, 'id' | 'code' | 'name'>;

export function MachineSelect({ machines, value, onChange }: { machines: Option[]; value: number | null; onChange: (id: number) => void }) {
  const t = useT();
  if (machines.length === 0) {
    return (
      <Notice tone="bad">{t('Size atanmış makine yok. Video kaydetmek için patronun sizi bir makineye usta olarak eklemesi gerekir.')}</Notice>
    );
  }
  return (
    <Field label={t('Makine')} htmlFor="rec-machine">
      <NativeSelect id="rec-machine" className="bg-card" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
        {value === null && <NativeSelectOption value="">{t('Makine seçin')}</NativeSelectOption>}
        {machines.map((m) => <NativeSelectOption key={m.id} value={m.id}>{m.code} · {m.name}</NativeSelectOption>)}
      </NativeSelect>
    </Field>
  );
}
