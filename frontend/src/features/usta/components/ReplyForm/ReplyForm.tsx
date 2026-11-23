import { useState, type FormEvent } from 'react';
import type { ReplyIn, ReplyKind } from '../../api';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';
import { useT } from '../../../../i18n';

const KINDS: [ReplyKind, string][] = [['text', '✍️ Metin'], ['video', '🎬 Video'], ['file', '📎 Dosya']];

/** Answer with text, a recorded/chosen video, or a file (KAN-63). */
export function ReplyForm({ sending, onSend }: { sending: boolean; onSend: (reply: ReplyIn) => void }) {
  const t = useT();
  const [kind, setKind] = useState<ReplyKind>('text');
  const [text, setText] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    const reply: ReplyIn = { text, video: kind === 'video' ? video : null, file: kind === 'file' ? file : null };
    if (!reply.text.trim() && !reply.video && !reply.file) return setError('Bir cevap yazın veya video/dosya ekleyin.');
    setError(undefined);
    onSend(reply);
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <fieldset className="chips">
        <legend className="sr-only">{t('Cevap türü')}</legend>
        {KINDS.map(([k, label]) => (
          <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{t(label)}</button>
        ))}
      </fieldset>
      {kind === 'video' && (
        <Field label={t('Video (çek veya seç)')} htmlFor="reply-video">
          <input id="reply-video" type="file" accept="video/*" capture="environment" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
        </Field>
      )}
      {kind === 'file' && (
        <Field label={t('Dosya (fotoğraf veya belge)')} htmlFor="reply-file">
          <input id="reply-file" type="file" accept="image/*,application/pdf,.docx,.xlsx,.csv,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
      )}
      <Field label={t(kind === 'text' ? 'Cevabın' : 'Not (isteğe bağlı)')} htmlFor="reply-text" error={error}>
        <textarea id="reply-text" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <Button type="submit" loading={sending}>{t('Cevabı gönder')}</Button>
      <p className="muted" style={{ margin: 0 }}>{t('Gönderince işçiye kendi dilinde iletilir, makineye ve profiline kaydedilir.')}</p>
    </form>
  );
}
