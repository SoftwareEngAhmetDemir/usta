import { postJson } from '../../api';

/** KAN-27 "remove": archives the machine; resolves true so useAction can tell success from an error. */
export async function archiveMachine(machineId: number): Promise<true> {
  await postJson<null>(`/machines/${machineId}/archive`, {});
  return true;
}
