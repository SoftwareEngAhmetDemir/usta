import type { AskFeedback } from '../../../../api';

interface Props {
  rated: AskFeedback | null;
  pending: boolean;
  onRate: (feedback: AskFeedback) => void;
}

/** 👍 / 👎 under an answer; the backend keeps it for evaluating search. */
export function Feedback({ rated, pending, onRate }: Props) {
  if (rated) return <output className="muted">Teşekkürler, geri bildiriminiz kaydedildi.</output>;
  return (
    <fieldset className="row" style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="muted" style={{ float: 'left', padding: 0 }}>İşe yaradı mı?</legend>
      <button type="button" className="chip" disabled={pending} onClick={() => onRate('helpful')}>👍 Evet</button>
      <button type="button" className="chip" disabled={pending} onClick={() => onRate('not_helpful')}>👎 Hayır</button>
    </fieldset>
  );
}
