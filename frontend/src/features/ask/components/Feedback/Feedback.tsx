import type { AskFeedback } from '../../../../api';
import { useT } from '../../../../i18n';

interface Props {
  rated: AskFeedback | null;
  pending: boolean;
  onRate: (feedback: AskFeedback) => void;
}

/** 👍 / 👎 under an answer; the backend keeps it for evaluating search. */
export function Feedback({ rated, pending, onRate }: Props) {
  const t = useT();
  if (rated) return <output className="muted">{t('Teşekkürler, geri bildiriminiz kaydedildi.')}</output>;
  return (
    <fieldset className="row" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="muted" style={{ float: 'left', padding: 0 }}>{t('İşe yaradı mı?')}</legend>
      <button type="button" className="chip" disabled={pending} onClick={() => onRate('helpful')}>{t('👍 Evet')}</button>
      <button type="button" className="chip" disabled={pending} onClick={() => onRate('not_helpful')}>{t('👎 Hayır')}</button>
    </fieldset>
  );
}
