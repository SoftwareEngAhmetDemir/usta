import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import type { Alert, AlertList } from '../../api';
import { fetchAlerts, markAlertRead } from './api';
import { AlertsContext } from './context';
import { useAlertSocket } from './hooks/useAlertSocket';

const TOAST_MS = 5000;

/** Loads saved alerts (also those that came while offline) and listens for live ones. */
export function AlertsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [list, setList] = useState<AlertList>({ unread_count: 0, items: [] });
  const [toast, setToast] = useState<Alert | null>(null);

  const load = useCallback(() => {
    fetchAlerts().then(setList, () => undefined);
  }, []);
  useEffect(load, [load]);

  useAlertSocket((alert) => {
    setToast(alert);
    load(); // the backend owns the list and the unread count
  }, load);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  const open = useCallback(
    (alert: Alert) => {
      setToast(null);
      if (!alert.read) markAlertRead(alert.id).then(setList, () => undefined);
      navigate(alert.path);
    },
    [navigate],
  );

  const value = useMemo(() => ({ list, toast, dismissToast: () => setToast(null), open }), [list, toast, open]);
  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}
