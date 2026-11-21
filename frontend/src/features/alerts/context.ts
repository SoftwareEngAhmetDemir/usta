import { createContext } from 'react';
import type { Alert, AlertList } from '../../api';

export interface AlertsContextValue {
  list: AlertList;
  toast: Alert | null;
  dismissToast: () => void;
  open: (alert: Alert) => void; // marks read and goes to alert.path
  received: number; // live alerts since the page opened; screens showing alert-driven lists refetch when it changes
}

export const AlertsContext = createContext<AlertsContextValue | null>(null);
