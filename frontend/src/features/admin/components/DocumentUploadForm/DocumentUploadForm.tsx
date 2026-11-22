import { useState, type FormEvent } from 'react';
import type { DocumentType, Machine } from '../../../../api';
import { Button } from '../../../../components/Button';
import { ErrorMessage } from '../../../../components/ErrorMessage';
import { Field } from '../../../../components/Field';
import { ProgressBar } from '../../../../components/ProgressBar';
import { DOCUMENT_TYPE_LABEL } from '../../../../lib/labels';
import type { DocumentUploadIn } from '../../api';
import type { SubmitState } from '../../hooks/useFormSubmit';

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
    <form className="card stack" onSubmit={submit} noValidate aria-label="Doküman ekle">
      <div className="label">Doküman ekle</div>
      <Field label="Makine" htmlFor="doc-machine">
        <select id="doc-machine" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
          <option value="">Seçin</option>
          {machines.map((m) => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}
        </select>
      </Field>
      <Field label="Tür" htmlFor="doc-type">
        <select id="doc-type" value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
          {TYPES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </Field>
      <Field label="Başlık" htmlFor="doc-title"><input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Dosya (PDF, Word, Excel, CSV, metin veya fotoğraf)" htmlFor="doc-file" error={error}>
        <input id="doc-file" type="file" accept={DOCUMENT_ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Field>
      {state.status === 'sending' && <ProgressBar fraction={state.progress} label="Yükleniyor" />}
      {state.status === 'error' && <ErrorMessage error={state.error} />}
      {state.status === 'done' && <output><span className="pill ok">Yüklendi</span> Metin çıkarma ve özet arka planda başladı.</output>}
      <Button type="submit" loading={state.status === 'sending'}>Yükle</Button>
    </form>
  );
}
