import { useState, type FormEvent } from 'react';
import type { MachineIn } from '../../../../api';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { useT } from '../../../../i18n';

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
  const t = useT();
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!values.code.trim() || !values.name.trim()) return setError('Makine kodu ve adı gerekli.');
    setError(undefined);
    onSubmit(values);
  }

  return (
    <form onSubmit={submit} noValidate aria-label={t('Makine ekle')}>
      <Card className="gap-4">
      {FIELDS.map((f) => (
        <Field key={f.key} label={t(f.label)} htmlFor={`machine-${f.key}`} error={f.key === 'name' ? error : undefined}>
          <Input id={`machine-${f.key}`} className={f.key === 'code' ? 'font-mono uppercase' : undefined} placeholder={f.placeholder && t(f.placeholder)} value={values[f.key]} autoCapitalize={f.key === 'code' ? 'characters' : undefined}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
        </Field>
      ))}
      <Button type="submit" loading={pending}>{t('Makineyi ekle')}</Button>
      </Card>
    </form>
  );
}
