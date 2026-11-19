import { useState } from 'react';
import type { PersonRef, QuestionSent } from '../../../../api';
import { Button } from '../../../../components/Button';

interface Props {
  question: string;
  ustas: PersonRef[];
  sent: QuestionSent | null;
  sending: boolean;
  onSend: (question: string) => void;
}

const names = (people: PersonRef[]) => people.map((p) => p.name).join(', ');

/** Nothing found: never guess; offer "Ustaya sor" with the question filled in (KAN-61, KAN-62). */
export function NotFoundCard({ question, ustas, sent, sending, onSend }: Props) {
  const [text, setText] = useState(question);
  if (sent) {
    return (
      <output className="card">
        <span className="pill info">Gönderildi</span>
        <span style={{ display: 'block', marginTop: 6 }}>
          Soru {sent.recipients.length ? names(sent.recipients) : 'işletme sahibi'} kişisine iletildi. Cevap gelince bildirim alacaksın.
        </span>
      </output>
    );
  }
  return (
    <section className="card warn stack" aria-label="Cevap bulunamadı">
      <div className="strong">Bu makinenin videolarında ve dokümanlarında cevap bulunamadı.</div>
      <p className="muted" style={{ margin: 0 }}>Tahmin etmiyoruz. Soruyu bu makinenin ustalarına gönderebilirsin.</p>
      <label className="sr-only" htmlFor="usta-q">Ustaya gidecek soru</label>
      <textarea id="usta-q" className="field" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
      <Button loading={sending} disabled={!text.trim()} onClick={() => onSend(text.trim())}>
        🧰 Ustaya sor{ustas.length > 0 && ` (${names(ustas)})`}
      </Button>
    </section>
  );
}
