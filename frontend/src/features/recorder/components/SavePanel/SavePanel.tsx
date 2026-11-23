import { useState, type FormEvent } from 'react';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';
import { Input } from '../../../../components/ui/input';
import { useT } from '../../../../i18n';

interface Props {
  saving: boolean;
  onRetake: () => void;
  onSave: (title: string) => void;
}

/** After recording (the machine is already chosen): a short title, then "Yeniden çek" or "Kaydet". */
export function SavePanel({ saving, onRetake, onSave }: Props) {
  const t = useT();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string>();
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError('Kısa bir başlık yazın.');
    setError(undefined);
    onSave(title.trim());
  }
  return (
    <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
      <Field label={t('Başlık')} htmlFor="rec-title" error={error}>
        <Input id="rec-title" className="bg-card" value={title} maxLength={120} placeholder={t('Örn. Torç kablosu kontrolü')} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onRetake} disabled={saving}>{t('Yeniden çek')}</Button>
        <Button type="submit" loading={saving}>{t('Kaydet')}</Button>
      </div>
    </form>
  );
}
