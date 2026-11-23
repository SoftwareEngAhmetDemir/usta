import type { Preparation } from '../../../../api';
import { Languages } from 'lucide-react';
import { StepList } from '../../../../components/StepList';
import { Card } from '../../../../components/ui/card';
import { useT } from '../../../../i18n';

/** "Diliniz için hazırlanıyor" with per-step status; a failed step can be retried alone (KAN-55). */
export function PreparationCard({ preparation, onRetry }: { preparation: Preparation; onRetry: (step: string) => void }) {
  const t = useT();
  return (
    <Card asChild className="border-primary/50 bg-accent/40"><section aria-live="polite"  aria-label={t('Hazırlık')}>
      <div className="flex items-center gap-2 font-semibold">
        <Languages className="size-5 text-warning" aria-hidden="true" />
        {t('Bu video')} {preparation.language_name} {t('hazırlanıyor')}
      </div>
      <p className="m-0 text-sm text-muted-foreground">{t('Hazır olunca bildirim gelecek. Bir kez hazırlanır, sonraki herkes hemen izler.')}</p>
      <StepList steps={preparation.steps} onRetry={onRetry} />
    </section></Card>
  );
}
