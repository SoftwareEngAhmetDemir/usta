import { errorMessage } from '../../api';

export function ErrorMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (!error) return null;
  return (
    <div className="alert-error row wrap" role="alert">
      <span className="grow">{errorMessage(error)}</span>
      {onRetry && (
        <button type="button" className="chip" onClick={onRetry}>
          Tekrar dene
        </button>
      )}
    </div>
  );
}
