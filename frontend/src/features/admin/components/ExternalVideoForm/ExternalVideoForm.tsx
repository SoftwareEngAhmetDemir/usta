import { useState, type FormEvent } from 'react';
import type { AdminMachineRow, ExternalSource } from '../../../../api';
import { Button } from '../../../../components/Button';
import { ErrorMessage } from '../../../../components/ErrorMessage';
import { Field } from '../../../../components/Field';
import { EXTERNAL_SOURCE_LABEL } from '../../../../lib/labels';
import type { SubmitState } from '../../hooks/useFormSubmit';
import type { ExternalVideoSubmit } from '../../types';

interface Props {
  machines: AdminMachineRow[];
  defaultMachineId: number | null;
  state: SubmitState;
  onSubmit: (body: ExternalVideoSubmit) => void;
}

const SOURCES = Object.entries(EXTERNAL_SOURCE_LABEL) as [ExternalSource, string][];

/** Add a manufacturer / service company video link (KAN-34). */
export function ExternalVideoForm({ machines, defaultMachineId, state, onSubmit }: Props) {
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
    <form className="card stack" onSubmit={submit} noValidate aria-label="Dış video ekle">
      <div className="label">Dış video ekle</div>
      <Field label="Makine" htmlFor="ext-machine">
        <select id="ext-machine" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
          <option value="">Seçin</option>
          {machines.map((m) => <option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}
        </select>
      </Field>
      <Field label="Başlık" htmlFor="ext-title"><input id="ext-title" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Bağlantı (YouTube vb.)" htmlFor="ext-url" error={error}>
        <input id="ext-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} />
      </Field>
      <Field label="Kaynak" htmlFor="ext-source">
        <select id="ext-source" value={source} onChange={(e) => setSource(e.target.value as ExternalSource)}>
          {SOURCES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
      </Field>
      {state.status === 'error' && <ErrorMessage error={state.error} />}
      {state.status === 'done' && <output><span className="pill ok">Eklendi</span> Makine sayfasında görünür.</output>}
      <Button type="submit" loading={state.status === 'sending'}>Ekle</Button>
    </form>
  );
}
