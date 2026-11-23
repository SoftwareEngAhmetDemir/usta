import type { Alert } from '../../../../api';
import { useT } from '../../../../i18n';

export function AlertToast({ alert, onOpen }: { alert: Alert | null; onOpen: (alert: Alert) => void }) {
  const t = useT();
  return (
    <div aria-live="polite">
      {alert && (
        <button type="button" className="toast" onClick={() => onOpen(alert)}>
          <span className="ic" aria-hidden="true">🔔</span>
          <span>{t(alert.text)}</span>
        </button>
      )}
    </div>
  );
}
