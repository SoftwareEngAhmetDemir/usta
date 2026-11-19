import { useContext } from 'react';
import { AlertsContext, type AlertsContextValue } from '../context';

export function useAlerts(): AlertsContextValue {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used inside <AlertsProvider>');
  return ctx;
}
