import type { PipelineStep, StepStatus } from '../../api';

const MARK: Record<StepStatus, string> = { waiting: '', running: '', done: '✓', failed: '!' };
const STATUS_TEXT: Record<StepStatus, string> = { waiting: 'bekliyor', running: 'çalışıyor', done: 'tamam', failed: 'hata' };

/** Processing / preparation steps; a failed step can offer "Tekrar dene". */
export function StepList({ steps, onRetry }: { steps: PipelineStep[]; onRetry?: (key: string) => void }) {
  return (
    <ol className="steps">
      {steps.map((s) => (
        <li key={s.key} className={`step ${s.status}`}>
          <span className="dot" aria-hidden="true">{MARK[s.status]}</span>
          <span className="grow">
            {s.label} <span className="sr-only">({STATUS_TEXT[s.status]})</span>
          </span>
          {s.status === 'failed' && onRetry && (
            <button type="button" className="chip" onClick={() => onRetry(s.key)}>Tekrar dene</button>
          )}
        </li>
      ))}
    </ol>
  );
}
