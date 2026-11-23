import { useState, type FormEvent } from 'react';
import type { AdminMachineRow, ExternalSource } from '../../../../api';
import { Button } from '../../../../components/Button';
import { ErrorMessage } from '../../../../components/ErrorMessage';
import { Field } from '../../../../components/Field';
import { Notice } from '../../../../components/Notice';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { NativeSelect, NativeSelectOption } from '../../../../components/ui/native-select';
import { EXTERNAL_SOURCE_LABEL } from '../../../../lib/labels';
import type { SubmitState } from '../../hooks/useFormSubmit';
import type { ExternalVideoSubmit } from '../../types';
import { useT } from '../../../../i18n';

interface Props {
  machines: AdminMachineRow[];
  defaultMachineId: number | null;
  state: SubmitState;
  onSubmit: (body: ExternalVideoSubmit) => void;
}

const SOURCES = Object.entries(EXTERNAL_SOURCE_LABEL) as [ExternalSource, string][];

/** Add a manufacturer / service company video link (KAN-34). */
export function ExternalVideoForm({ machines, defaultMachineId, state, onSubmit }: Props) {
  const t = useT();
  const [machineId, setMachineId] = useState(String(defaultMachineId ?? ''));
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState<ExternalSource>('manufacturer');
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!machineId || !title.trim() || !/^https?:\/\//.test(url.trim())) return setError('Makine, başlık ve http(s) ile başlayan bir bağlantı gerekli.');
    setError(undefined);
    onSubmit({ machineId: Number(machineId), title: title.trim(), url: url.trim(), source });
  }

  return (
    <form onSubmit={submit} noValidate aria-label={t('Dış video ekle')}>
      <Card className="gap-4">
      <div className="font-display text-lg font-semibold tracking-wide text-steel uppercase">{t('Dış video ekle')}</div>
      <Field label={t('Makine')} htmlFor="ext-machine">
        <NativeSelect id="ext-machine" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
          <NativeSelectOption value="">{t('Seçin')}</NativeSelectOption>
          {machines.map((m) => <NativeSelectOption key={m.id} value={m.id}>{m.code} · {m.name}</NativeSelectOption>)}
        </NativeSelect>
      </Field>
      <Field label={t('Başlık')} htmlFor="ext-title"><Input id="ext-title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label={t('Bağlantı (YouTube vb.)')} htmlFor="ext-url" error={error}>
        <Input id="ext-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <Field label={t('Kaynak')} htmlFor="ext-source">
        <NativeSelect id="ext-source" value={source} onChange={(e) => setSource(e.target.value as ExternalSource)}>
          {SOURCES.map(([k, label]) => <NativeSelectOption key={k} value={k}>{t(label)}</NativeSelectOption>)}
        </NativeSelect>
      </Field>
      {state.status === 'error' && <ErrorMessage error={state.error} />}
      {state.status === 'done' && <Notice tone="ok" title={t('Eklendi')}>{t('Makine sayfasında görünür.')}</Notice>}
      <Button type="submit" loading={state.status === 'sending'}>{t('Ekle')}</Button>
      </Card>
    </form>
  );
}
