import { CircleAlert, RotateCw } from 'lucide-react';
import { errorMessage } from '../../api';
import { useT } from '../../i18n';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';

export function ErrorMessage({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useT();
  if (!error) return null;
  return (
    <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
      <CircleAlert aria-hidden="true" />
      <AlertDescription className="flex flex-wrap items-center gap-2 text-destructive">
        <span className="flex-1">{t(errorMessage(error), { quiet: true })}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw aria-hidden="true" />
            {t('Tekrar dene')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
