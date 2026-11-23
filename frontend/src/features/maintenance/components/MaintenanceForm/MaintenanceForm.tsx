import { useState, type FormEvent } from 'react';
import type { PersonRef } from '../../../../api';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';
import type { MaintenanceIn } from '../../api';
import { useT } from '../../../../i18n';

interface Props {
  openers: PersonRef[];
  saving: boolean;
  onSave: (body: MaintenanceIn) => void;
}

/** What was done, who opened the machine, optional photo/video (KAN-39). */
export function MaintenanceForm({ openers, saving, onSave }: Props) {
  const t = useT();
  const [description, setDescription] = useState('');
  const [openedBy, setOpenedBy] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ description?: string; openedBy?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = {
      description: description.trim() ? undefined : 'Yapılan işi yazın.',
      openedBy: openedBy ? undefined : 'Makineyi kimin açtığını seçin.',
    };
    setErrors(next);
    if (next.description || next.openedBy) return;
    onSave({ description: description.trim(), opened_by_id: Number(openedBy), attachment });
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <Field label={t('Yapılan iş')} htmlFor="m-what" error={errors.description}>
        <textarea id="m-what" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label={t('Makineyi açan')} htmlFor="m-open" error={errors.openedBy}>
        <select id="m-open" value={openedBy} onChange={(e) => setOpenedBy(e.target.value)}>
          <option value="">{t('Seçin')}</option>
          {openers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label={t('Fotoğraf / video (isteğe bağlı)')} htmlFor="m-file">
        <input id="m-file" type="file" accept="image/*,video/*" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
      </Field>
      <Button type="submit" loading={saving}>{t('Bakımı kaydet')}</Button>
    </form>
  );
}
