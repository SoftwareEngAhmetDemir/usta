import { errorMessage } from '../../api';
import { useT } from '../../i18n';

export function ErrorMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useT();
  if (!error) return null;
  return (
    <div className="alert-error row wrap" role="alert">
      <span className="grow">{t(errorMessage(error))}</span>
      {onRetry && (
        <button type="button" className="chip" onClick={onRetry}>
          {t('Tekrar dene')}
        </button>
      )}
    </div>
  );
}
