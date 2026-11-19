import { postJson, request } from '../../api';
import type { AlertList } from '../../api';

export const fetchAlerts = (): Promise<AlertList> => request<AlertList>('/alerts');
export const markAlertRead = (id: number): Promise<AlertList> => postJson<AlertList>(`/alerts/${id}/read`, {});

export function alertSocketUrl(loc: Pick<Location, 'protocol' | 'host'> = window.location): string {
  const base = import.meta.env.VITE_API_URL;
  if (base) return `${base.replace(/^http/, 'ws')}/api/ws/alerts`;
  return `${loc.protocol === 'https:' ? 'wss' : 'ws'}://${loc.host}/api/ws/alerts`;
}
