import type { AnswerSource, LocalizedText } from '../../../../api';
import { ErrorMessage } from '../../../../components/ErrorMessage';
import { Localized } from '../../../../components/Localized';
import { useFeedback } from '../../hooks/useFeedback';
import { Feedback } from '../Feedback';
import { SourceCard } from '../SourceCard';
import { useT } from '../../../../i18n';

interface Props {
  answer: LocalizedText;
  sources: AnswerSource[];
  askId: number;
}

export function AnswerCard({ answer, sources, askId }: Props) {
  const t = useT();
  const feedback = useFeedback(askId);
  return (
    <section className="card info" aria-label={t('Cevap')}>
      <div className="label">{t('Cevap')}</div>
      <Localized as="p" value={answer} />
      <div className="label">{t('Kaynaklar')}</div>
      <div className="stack" style={{ marginTop: 6 }}>
        {sources.map((s, i) => <SourceCard key={i} source={s} />)}
      </div>
      <div className="safety-note">{t('Cevap yalnızca bu makinenin kaynaklarından üretildi.')}</div>
      <Feedback rated={feedback.rated} pending={feedback.pending} onRate={(f) => void feedback.rate(f)} />
      <ErrorMessage error={feedback.error} />
    </section>
  );
}
