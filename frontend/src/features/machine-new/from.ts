/** What the scan page hands the new-machine form: the scanned QR to attach, or the typed code to fill in. Sent as
 * router state, never in the URL: a QR can hold anything (a bill's tax numbers), and state survives a reload. */
export type NewMachineFrom = { qr: string } | { code: string };

export const newMachineState = ({ code, typed }: { code: string; typed: boolean }): NewMachineFrom => (typed ? { code } : { qr: code });

/** `location.state` is untyped: take only what has the expected shape. */
export function readNewMachineFrom(state: unknown): { qr?: string; code?: string } {
  if (!state || typeof state !== 'object') return {};
  return {
    qr: 'qr' in state && typeof state.qr === 'string' && state.qr.trim() ? state.qr : undefined,
    code: 'code' in state && typeof state.code === 'string' ? state.code : undefined,
  };
}
