import { useState, type FormEvent } from 'react';
import type { PersonRef } from '../../../../api';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { NativeSelect, NativeSelectOption } from '../../../../components/ui/native-select';
import { Textarea } from '../../../../components/ui/textarea';
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
    <form onSubmit={submit} noValidate>
      <Card className="gap-4">
      <Field label={t('Yapılan iş')} htmlFor="m-what" error={errors.description}>
        <Textarea id="m-what" className="min-h-28" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label={t('Makineyi açan')} htmlFor="m-open" error={errors.openedBy}>
        <NativeSelect id="m-open" value={openedBy} onChange={(e) => setOpenedBy(e.target.value)}>
          <NativeSelectOption value="">{t('Seçin')}</NativeSelectOption>
          {openers.map((p) => <NativeSelectOption key={p.id} value={p.id}>{p.name}</NativeSelectOption>)}
        </NativeSelect>
      </Field>
      <Field label={t('Fotoğraf / video (isteğe bağlı)')} htmlFor="m-file">
        <Input id="m-file" className="pt-2" type="file" accept="image/*,video/*" onChange={(e) => setAttachment(e.target.files?.[0] ?? null)} />
      </Field>
      <Button type="submit" loading={saving}>{t('Bakımı kaydet')}</Button>
      </Card>
    </form>
  );
}
