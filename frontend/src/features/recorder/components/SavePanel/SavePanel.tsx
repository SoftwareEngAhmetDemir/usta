import { useState, type FormEvent } from 'react';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';

interface Props {
  saving: boolean;
  canSave: boolean; // a machine is chosen
  onRetake: () => void;
  onSave: (title: string) => void;
}

/** After recording: a short title, then "Yeniden çek" or "Kaydet". */
export function SavePanel({ saving, canSave, onRetake, onSave }: Props) {
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
        <Button type="submit" loading={saving} disabled={!canSave}>Kaydet</Button>
      </div>
      {!canSave && <p className="muted" style={{ margin: 0 }}>Kaydetmek için yukarıdan bir makine seçin.</p>}
    </form>
  );
}
