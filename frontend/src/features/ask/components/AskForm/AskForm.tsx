import { SendHorizontal } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../../../../components/Button';
import { Textarea } from '../../../../components/ui/textarea';
import { useT } from '../../../../i18n';

export function AskForm({ onAsk, busy }: { onAsk: (question: string) => void; busy: boolean }) {
  const t = useT();
  const [text, setText] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    onAsk(q);
    setText('');
  }
  return (
    <form className="flex items-stretch gap-2" onSubmit={submit}>
      <label className="sr-only" htmlFor="ask-q">{t('Sorunuz')}</label>
      <Textarea id="ask-q" rows={2} className="min-h-12 flex-1 resize-y border-steel/40 bg-card text-base" placeholder={t('Sorunuzu yazın…')} value={text} onChange={(e) => setText(e.target.value)} />
      <Button type="submit" className="h-auto w-auto px-5" loading={busy} disabled={!text.trim()}>
        {!busy && <SendHorizontal className="rtl:rotate-180" aria-hidden="true" />}
        {t('Sor')}
      </Button>
    </form>
  );
}
