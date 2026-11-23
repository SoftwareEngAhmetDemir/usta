import { useState, type FormEvent } from 'react';
import type { DocumentType, Machine } from '../../../../api';
import { Button } from '../../../../components/Button';
import { ErrorMessage } from '../../../../components/ErrorMessage';
import { Field } from '../../../../components/Field';
import { Notice } from '../../../../components/Notice';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { NativeSelect, NativeSelectOption } from '../../../../components/ui/native-select';
import { ProgressBar } from '../../../../components/ProgressBar';
import { DOCUMENT_TYPE_LABEL } from '../../../../lib/labels';
import type { DocumentUploadIn } from '../../api';
import type { SubmitState } from '../../hooks/useFormSubmit';
import { useT } from '../../../../i18n';

interface Props {
  machines: Pick<Machine, 'id' | 'code' | 'name'>[];
  defaultMachineId: number | null;
  state: SubmitState;
  onSubmit: (body: DocumentUploadIn) => void;
}

const TYPES = Object.entries(DOCUMENT_TYPE_LABEL) as [DocumentType, string][];
// What the backend can read (app/documents/extract.py); scanned PDFs and photos go through OCR.
const DOCUMENT_ACCEPT = 'application/pdf,image/*,.docx,.xlsx,.csv,.txt';

/** Upload a PDF or image to a machine with its type (KAN-33). */
export function DocumentUploadForm({ machines, defaultMachineId, state, onSubmit }: Props) {
  const t = useT();
  const [machineId, setMachineId] = useState(String(defaultMachineId ?? ''));
  const [type, setType] = useState<DocumentType>('user_manual');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!machineId || !title.trim() || !file) return setError('Makine, başlık ve dosya gerekli.');
    setError(undefined);
    onSubmit({ machineId: Number(machineId), type, title: title.trim(), file });
  }

  return (
    <form onSubmit={submit} noValidate aria-label={t('Doküman ekle')}>
      <Card className="gap-4">
      <div className="font-display text-lg font-semibold tracking-wide text-steel uppercase">{t('Doküman ekle')}</div>
      <Field label={t('Makine')} htmlFor="doc-machine">
        <NativeSelect id="doc-machine" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
          <NativeSelectOption value="">{t('Seçin')}</NativeSelectOption>
          {machines.map((m) => <NativeSelectOption key={m.id} value={m.id}>{m.code} · {m.name}</NativeSelectOption>)}
        </NativeSelect>
      </Field>
      <Field label={t('Tür')} htmlFor="doc-type">
        <NativeSelect id="doc-type" value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
          {TYPES.map(([k, label]) => <NativeSelectOption key={k} value={k}>{t(label)}</NativeSelectOption>)}
        </NativeSelect>
      </Field>
      <Field label={t('Başlık')} htmlFor="doc-title"><Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label={t('Dosya (PDF, Word, Excel, CSV, metin veya fotoğraf)')} htmlFor="doc-file" error={error}>
        <Input id="doc-file" className="pt-2" type="file" accept={DOCUMENT_ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Field>
      {state.status === 'sending' && <ProgressBar fraction={state.progress} label={t('Yükleniyor')} />}
      {state.status === 'error' && <ErrorMessage error={state.error} />}
      {state.status === 'done' && <Notice tone="ok" title={t('Yüklendi')}>{t('Metin çıkarma ve özet arka planda başladı.')}</Notice>}
      <Button type="submit" loading={state.status === 'sending'}>{t('Yükle')}</Button>
      </Card>
    </form>
  );
}
