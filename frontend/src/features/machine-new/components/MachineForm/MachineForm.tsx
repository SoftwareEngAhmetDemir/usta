import { useState, type FormEvent } from 'react';
import type { MachineIn } from '../../../../api';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';

const FIELDS: { key: keyof MachineIn; label: string; placeholder: string }[] = [
  { key: 'code', label: 'Makine kodu (QR’ın altına yazılır)', placeholder: 'Örn. PK-105' },
  { key: 'name', label: 'Makine adı', placeholder: 'Örn. Plazma Kesim Makinesi' },
  { key: 'type', label: 'Tür', placeholder: 'Örn. Plazma kesim' },
  { key: 'model', label: 'Marka / model', placeholder: 'Örn. Hypertherm PK-105' },
  { key: 'serial', label: 'Seri no', placeholder: '' },
  { key: 'location', label: 'Konum', placeholder: 'Örn. Atölye A' },
];
const EMPTY: MachineIn = { code: '', name: '', type: '', model: '', serial: '', location: '' };

/** New machine details; code and name are required (KAN-27). */
export function MachineForm({ pending, onSubmit }: { pending: boolean; onSubmit: (body: MachineIn) => void }) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!values.code.trim() || !values.name.trim()) return setError('Makine kodu ve adı gerekli.');
    setError(undefined);
    onSubmit(values);
  }

  return (
    <form className="card stack" onSubmit={submit} noValidate aria-label="Makine ekle">
      {FIELDS.map((f) => (
        <Field key={f.key} label={f.label} htmlFor={`machine-${f.key}`} error={f.key === 'name' ? error : undefined}>
          <input id={`machine-${f.key}`} placeholder={f.placeholder} value={values[f.key]} autoCapitalize={f.key === 'code' ? 'characters' : undefined}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
        </Field>
      ))}
      <Button type="submit" loading={pending}>Makineyi ekle</Button>
    </form>
  );
}
