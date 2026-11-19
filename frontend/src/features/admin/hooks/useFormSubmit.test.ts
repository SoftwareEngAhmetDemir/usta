import { act, renderHook } from '@testing-library/react';
import { useFormSubmit } from './useFormSubmit';

describe('useFormSubmit', () => {
  it('tracks progress and done', async () => {
    const { result } = renderHook(() => useFormSubmit(async (_b: number, p: (f: number) => void) => p(0.5)));
    let ok = false;
    await act(async () => { ok = await result.current.submit(1); });
    expect(ok).toBe(true);
    expect(result.current.state).toEqual({ status: 'done' });
  });
  it('reports errors', async () => {
    const { result } = renderHook(() => useFormSubmit(() => Promise.reject(new Error('x'))));
    await act(async () => { await result.current.submit(1); });
    expect(result.current.state.status).toBe('error');
  });
});
