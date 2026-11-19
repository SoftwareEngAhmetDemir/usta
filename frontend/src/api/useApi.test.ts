import { act, renderHook, waitFor } from '@testing-library/react';
import { useApi } from './useApi';
import { mockApi } from '../test/utils';

describe('useApi', () => {
  it('loads data', async () => {
    mockApi({ 'GET /a': { n: 1 } });
    const { result } = renderHook(() => useApi<{ n: number }>('/a'));
    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', data: { n: 1 } }));
  });

  it('reports errors', async () => {
    mockApi({});
    const { result } = renderHook(() => useApi('/missing'));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
  });

  it('reload refetches and keeps data on a failed refresh', async () => {
    let n = 0;
    const { fetchMock } = mockApi({ 'GET /a': () => ({ n: ++n }) });
    const { result } = renderHook(() => useApi<{ n: number }>('/a'));
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', data: { n: 1 } }));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', data: { n: 2 } }));
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    act(() => result.current.reload());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(result.current.state).toEqual({ status: 'ok', data: { n: 2 } });
  });

  it('skips when path is null and shows loading for a new path', async () => {
    const { fetchMock } = mockApi({ 'GET /a': { n: 1 }, 'GET /b': { n: 2 } });
    const { result, rerender } = renderHook(({ p }: { p: string | null }) => useApi(p), { initialProps: { p: null } as { p: string | null } });
    expect(fetchMock).not.toHaveBeenCalled();
    rerender({ p: '/a' });
    await waitFor(() => expect(result.current.state.status).toBe('ok'));
    rerender({ p: '/b' });
    expect(result.current.state.status).toBe('loading');
  });
});

describe('useApi polling', () => {
  it('polls while the function returns an interval and stops after', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let n = 0;
    const { fetchMock } = mockApi({ 'GET /p': () => ({ done: ++n >= 2 }) });
    const { result } = renderHook(() => useApi<{ done: boolean }>('/p', (d) => (d.done ? undefined : 1000)));
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', data: { done: false } }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ok', data: { done: true } }));
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
