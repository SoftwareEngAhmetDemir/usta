import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { AskFeedback } from '../../../../api';
import { Chip } from '../../../../components/Chip';
import { useT } from '../../../../i18n';

interface Props {
  rated: AskFeedback | null;
  pending: boolean;
  onRate: (feedback: AskFeedback) => void;
}

/** 👍 / 👎 under an answer; the backend keeps it for evaluating search. */
export function Feedback({ rated, pending, onRate }: Props) {
  const t = useT();
  if (rated) return <output className="text-sm text-muted-foreground">{t('Teşekkürler, geri bildiriminiz kaydedildi.')}</output>;
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="float-start me-1 text-sm text-muted-foreground">{t('İşe yaradı mı?')}</legend>
      <Chip disabled={pending} onClick={() => onRate('helpful')}><ThumbsUp aria-hidden="true" />{t('Evet')}</Chip>
      <Chip disabled={pending} onClick={() => onRate('not_helpful')}><ThumbsDown aria-hidden="true" />{t('Hayır')}</Chip>
    </fieldset>
  );
}
