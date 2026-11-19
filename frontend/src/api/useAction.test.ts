import { act, renderHook } from '@testing-library/react';
import { useAction } from './useAction';

describe('useAction', () => {
  it('returns the result and clears pending', async () => {
    const { result } = renderHook(() => useAction(async (x: number) => x * 2));
    let out: number | undefined;
    await act(async () => {
      out = await result.current.run(2);
    });
    expect(out).toBe(4);
    expect(result.current.pending).toBe(false);
  });

  it('captures errors instead of throwing', async () => {
    const boom = new Error('x');
    const { result } = renderHook(() => useAction(async () => Promise.reject(boom)));
    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe(boom);
    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
  });
});
