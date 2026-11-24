import { postJson } from '../../api';
import type { MachineIn } from '../../api';

export const createMachine = (body: MachineIn): Promise<{ id: number }> => postJson<{ id: number }>('/machines', body);

/** The code a machine added with this scanned QR gets (the backend's rule; POST keeps the QR out of URLs). */
export const codeForQr = (qr_text: string): Promise<{ code: string }> => postJson<{ code: string }>('/machines/code-for-qr', { qr_text });
