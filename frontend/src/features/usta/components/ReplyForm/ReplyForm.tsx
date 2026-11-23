import { FileUp, PenLine, Video, type LucideIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { ReplyIn, ReplyKind } from '../../api';
import { Button } from '../../../../components/Button';
import { Chip } from '../../../../components/Chip';
import { Field } from '../../../../components/Field';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { useT } from '../../../../i18n';

const KINDS: [ReplyKind, string, LucideIcon][] = [['text', 'Metin', PenLine], ['video', 'Video', Video], ['file', 'Dosya', FileUp]];

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
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="sr-only">{t('Cevap türü')}</legend>
        {KINDS.map(([k, label, Icon]) => (
          <Chip key={k} aria-pressed={kind === k} onClick={() => setKind(k)} className="h-11 justify-center rounded-lg"><Icon aria-hidden="true" />{t(label)}</Chip>
        ))}
      </fieldset>
      {kind === 'video' && (
        <Field label={t('Video (çek veya seç)')} htmlFor="reply-video">
          <Input id="reply-video" className="pt-2" type="file" accept="video/*" capture="environment" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
        </Field>
      )}
      {kind === 'file' && (
        <Field label={t('Dosya (fotoğraf veya belge)')} htmlFor="reply-file">
          <Input id="reply-file" className="pt-2" type="file" accept="image/*,application/pdf,.docx,.xlsx,.csv,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
      )}
      <Field label={t(kind === 'text' ? 'Cevabın' : 'Not (isteğe bağlı)')} htmlFor="reply-text" error={error}>
        <Textarea id="reply-text" className="min-h-28 bg-card" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <Button type="submit" loading={sending}>{t('Cevabı gönder')}</Button>
      <p className="m-0 text-sm text-muted-foreground">{t('Gönderince işçiye kendi dilinde iletilir, makineye ve profiline kaydedilir.')}</p>
    </form>
  );
}
