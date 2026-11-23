import type { Preparation } from '../../../../api';
import { StepList } from '../../../../components/StepList';
import { useT } from '../../../../i18n';

/** "Diliniz için hazırlanıyor" with per-step status; a failed step can be retried alone (KAN-55). */
export function PreparationCard({ preparation, onRetry }: { preparation: Preparation; onRetry: (step: string) => void }) {
  const t = useT();
  return (
    <section className="card warn stack" aria-live="polite">
      <div className="strong">{t('Bu video')}{' '}{preparation.language_name}{' '}{t('hazırlanıyor')}</div>
      <p className="muted" style={{ margin: 0 }}>{t('Hazır olunca bildirim gelecek. Bir kez hazırlanır, sonraki herkes hemen izler.')}</p>
      <StepList steps={preparation.steps} onRetry={onRetry} />
    </section>
  );
}
