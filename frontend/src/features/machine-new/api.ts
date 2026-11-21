import { postJson } from '../../api';
import type { MachineIn } from '../../api';

export const createMachine = (body: MachineIn): Promise<{ id: number }> => postJson<{ id: number }>('/machines', body);
