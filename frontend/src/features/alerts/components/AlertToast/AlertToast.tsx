import { BellRing } from 'lucide-react';
import type { Alert } from '../../../../api';
import { useT } from '../../../../i18n';

export function AlertToast({ alert, onOpen }: { alert: Alert | null; onOpen: (alert: Alert) => void }) {
  const t = useT();
  return (
    <div aria-live="polite">
      {alert && (
        <button
          type="button"
          data-slot="toast"
          onClick={() => onOpen(alert)}
          className="fixed inset-x-3 top-[72px] z-40 mx-auto flex max-w-[536px] items-center gap-3 rounded-xl bg-foreground p-3 text-start text-background shadow-xl animate-in slide-in-from-top-2 fade-in-0"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
            <BellRing className="size-5" />
          </span>
          <span className="text-sm">{t(alert.text, { quiet: true })}</span>
        </button>
      )}
    </div>
  );
}
