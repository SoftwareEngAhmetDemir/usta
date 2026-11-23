import { CircleHelp, Send, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { PersonRef, QuestionSent } from '../../../../api';
import { Button } from '../../../../components/Button';
import { Pill } from '../../../../components/Pill';
import { Card } from '../../../../components/ui/card';
import { Textarea } from '../../../../components/ui/textarea';
import { useT } from '../../../../i18n';

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
  const t = useT();
  const [text, setText] = useState(question);
  if (sent) {
    return (
      <output className="flex flex-col items-start gap-2 rounded-xl border bg-card p-4 shadow-xs">
        <Pill tone="info"><Send aria-hidden="true" />{t('Gönderildi')}</Pill>
        <span>{t('Soru iletildi:')} {sent.recipients.length ? names(sent.recipients) : t('işletme sahibi')}. {t('Cevap gelince bildirim alacaksın.')}</span>
      </output>
    );
  }
  return (
    <Card asChild className="border-primary/50 bg-accent/40"><section aria-label={t('Cevap bulunamadı')}>
      <div className="flex gap-2 font-semibold">
        <CircleHelp className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
        {t('Bu makinenin videolarında ve dokümanlarında cevap bulunamadı.')}
      </div>
      <p className="m-0 text-sm text-muted-foreground">{t('Tahmin etmiyoruz. Soruyu bu makinenin ustalarına gönderebilirsin.')}</p>
      <label className="sr-only" htmlFor="usta-q">{t('Ustaya gidecek soru')}</label>
      <Textarea id="usta-q" rows={2} className="bg-card" value={text} onChange={(e) => setText(e.target.value)} />
      <Button loading={sending} disabled={!text.trim()} onClick={() => onSend(text.trim())}>
        {!sending && <UserRound aria-hidden="true" />}
        {t('Ustaya sor')}{ustas.length > 0 && ` (${names(ustas)})`}
      </Button>
    </section></Card>
  );
}
