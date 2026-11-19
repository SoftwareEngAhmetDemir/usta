import { uploadWithProgress } from '../../api';
import type { MaintenanceRecord } from '../../api';

export interface MaintenanceIn {
  description: string;
  opened_by_id: number;
  attachment: File | null;
}

/** "Who did it" and the time are set by the backend from the session; they cannot be sent (KAN-39). */
export function createMaintenance(machineId: string, body: MaintenanceIn, onProgress: (f: number) => void): Promise<MaintenanceRecord> {
  const form = new FormData();
  form.append('description', body.description);
  form.append('opened_by_id', String(body.opened_by_id));
  if (body.attachment) form.append('attachment', body.attachment);
  return uploadWithProgress<MaintenanceRecord>(`/machines/${machineId}/maintenance`, form, onProgress);
}
