import { CircleCheck, CircleDashed, CircleX, Loader2, RotateCw } from 'lucide-react';
import type { PipelineStep, StepStatus } from '../../api';
import { useT } from '../../i18n';
import { Button } from '../ui/button';

const ICON = {
  waiting: <CircleDashed className="size-5 text-muted-foreground" aria-hidden="true" />,
  running: <Loader2 className="size-5 animate-spin text-warning" aria-hidden="true" />,
  done: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
  failed: <CircleX className="size-5 text-destructive" aria-hidden="true" />,
} satisfies Record<StepStatus, unknown>;
const STATUS_TEXT: Record<StepStatus, string> = { waiting: 'bekliyor', running: 'çalışıyor', done: 'tamam', failed: 'hata' };

/** Processing / preparation steps; a failed step can offer "Tekrar dene". */
export function StepList({ steps, onRetry }: { steps: PipelineStep[]; onRetry?: (key: string) => void }) {
  const t = useT();
  return (
    <ol className="m-0 flex list-none flex-col gap-2 p-0">
      {steps.map((s) => (
        <li key={s.key} data-status={s.status} className="flex items-center gap-2.5 text-sm data-[status=waiting]:text-muted-foreground">
          {ICON[s.status]}
          <span className="min-w-0 flex-1">
            {t(s.label)} <span className="sr-only">({t(STATUS_TEXT[s.status])})</span>
          </span>
          {s.status === 'failed' && onRetry && (
            <Button variant="outline" size="sm" onClick={() => onRetry(s.key)}>
              <RotateCw aria-hidden="true" />
              {t('Tekrar dene')}
            </Button>
          )}
        </li>
      ))}
    </ol>
  );
}
