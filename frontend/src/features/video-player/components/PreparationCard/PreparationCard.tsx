import type { Preparation } from '../../../../api';
import { StepList } from '../../../../components/StepList';

/** "Diliniz için hazırlanıyor" with per-step status; a failed step can be retried alone (KAN-55). */
export function PreparationCard({ preparation, onRetry }: { preparation: Preparation; onRetry: (step: string) => void }) {
  return (
    <section className="card warn stack" aria-live="polite">
      <div className="strong">Bu video {preparation.language_name} hazırlanıyor</div>
      <p className="muted" style={{ margin: 0 }}>Hazır olunca bildirim gelecek. Bir kez hazırlanır, sonraki herkes hemen izler.</p>
      <StepList steps={preparation.steps} onRetry={onRetry} />
    </section>
  );
}
