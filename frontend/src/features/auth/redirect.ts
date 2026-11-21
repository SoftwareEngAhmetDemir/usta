/** The page RequireAuth remembered (e.g. the scanned machine), carried in router state through login/register. */
export function fromState(state: unknown): string | null {
  if (state && typeof state === 'object' && 'from' in state && typeof state.from === 'string') return state.from;
  return null;
}
