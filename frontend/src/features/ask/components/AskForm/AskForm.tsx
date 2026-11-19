import { useState, type FormEvent } from 'react';
import { Button } from '../../../../components/Button';

export function AskForm({ onAsk, busy }: { onAsk: (question: string) => void; busy: boolean }) {
  const [text, setText] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    onAsk(q);
    setText('');
  }
  return (
    <form className="ask-input" onSubmit={submit}>
      <label className="sr-only" htmlFor="ask-q">Sorunuz</label>
      <textarea id="ask-q" rows={2} placeholder="Sorunuzu yazın…" value={text} onChange={(e) => setText(e.target.value)} />
      <Button type="submit" loading={busy} disabled={!text.trim()}>Sor</Button>
    </form>
  );
}
