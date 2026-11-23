import { ShieldCheck } from 'lucide-react';
import type { AnswerSource, LocalizedText } from '../../../../api';
import { ErrorMessage } from '../../../../components/ErrorMessage';
import { Localized } from '../../../../components/Localized';
import { Card } from '../../../../components/ui/card';
import { useFeedback } from '../../hooks/useFeedback';
import { Feedback } from '../Feedback';
import { SourceCard } from '../SourceCard';
import { useT } from '../../../../i18n';

interface Props {
  answer: LocalizedText;
  sources: AnswerSource[];
  askId: number;
}

const caption = 'text-xs font-semibold tracking-wide text-muted-foreground uppercase';

export function AnswerCard({ answer, sources, askId }: Props) {
  const t = useT();
  const feedback = useFeedback(askId);
  return (
    <Card asChild className="border-s-4 border-s-steel"><section aria-label={t('Cevap')}>
      <div className={caption}>{t('Cevap')}</div>
      <Localized as="p" value={answer} />
      <div className={caption}>{t('Kaynaklar')}</div>
      <div className="flex flex-col gap-2">
        {sources.map((s, i) => <SourceCard key={i} source={s} />)}
      </div>
      <div className="flex items-center gap-1.5 border-t border-dashed pt-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
        {t('Cevap yalnızca bu makinenin kaynaklarından üretildi.')}
      </div>
      <Feedback rated={feedback.rated} pending={feedback.pending} onRate={(f) => void feedback.rate(f)} />
      <ErrorMessage error={feedback.error} />
    </section></Card>
  );
}
