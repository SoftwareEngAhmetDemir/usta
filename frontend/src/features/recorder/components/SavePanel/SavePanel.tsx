import { useState, type FormEvent } from 'react';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';

interface Props {
  saving: boolean;
  onRetake: () => void;
  onSave: (title: string) => void;
}

/** After recording (the machine is already chosen): a short title, then "Yeniden çek" or "Kaydet". */
export function SavePanel({ saving, onRetake, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string>();
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError('Kısa bir başlık yazın.');
    setError(undefined);
    onSave(title.trim());
  }
  return (
    <form className="stack" onSubmit={submit} noValidate>
      <Field label="Başlık" htmlFor="rec-title" error={error}>
        <input id="rec-title" value={title} maxLength={120} placeholder="Örn. Torç kablosu kontrolü" onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <div className="row">
        <Button variant="secondary" onClick={onRetake} disabled={saving}>Yeniden çek</Button>
        <Button type="submit" loading={saving}>Kaydet</Button>
      </div>
    </form>
  );
}
