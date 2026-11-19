import type { Alert } from '../../../../api';

export function AlertToast({ alert, onOpen }: { alert: Alert | null; onOpen: (alert: Alert) => void }) {
  return (
    <div aria-live="polite">
      {alert && (
        <button type="button" className="toast" onClick={() => onOpen(alert)}>
          <span className="ic" aria-hidden="true">🔔</span>
          <span>{alert.text}</span>
        </button>
      )}
    </div>
  );
}
