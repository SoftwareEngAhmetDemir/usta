import { act, renderHook } from '@testing-library/react';
import { mockApi } from '../../../test/utils';
import { useDeleteContent } from './useDeleteContent';

const target = { kind: 'videos' as const, id: 2, title: 'Hava basıncı' };

describe('useDeleteContent', () => {
  it('deletes the chosen item, closes and reloads', async () => {
    const { calls } = mockApi({ 'DELETE /videos/2': null });
    const onDeleted = vi.fn();
    const { result } = renderHook(() => useDeleteContent(onDeleted));
    act(() => result.current.ask(target));
    expect(result.current.open).toBe(true);
    await act(() => result.current.confirm());
    expect(calls).toContainEqual(expect.objectContaining({ method: 'DELETE', path: '/videos/2' }));
    expect(result.current.open).toBe(false);
    expect(result.current.target).toEqual(target); // kept for the closing animation
    expect(onDeleted).toHaveBeenCalledOnce();
  });
  it('treats an already deleted item (404) as done and reloads', async () => {
    mockApi({});
    const onDeleted = vi.fn();
    const { result } = renderHook(() => useDeleteContent(onDeleted));
    act(() => result.current.ask(target));
    await act(() => result.current.confirm());
    expect(result.current.open).toBe(false);
    expect(onDeleted).toHaveBeenCalledOnce();
  });
  it('stays open with the error when the delete is refused', async () => {
    mockApi({ 'DELETE /documents/2': () => { throw new Error('offline'); } });
    const onDeleted = vi.fn();
    const { result } = renderHook(() => useDeleteContent(onDeleted));
    act(() => result.current.ask({ ...target, kind: 'documents' }));
    await act(() => result.current.confirm());
    expect(result.current.open).toBe(true);
    expect(result.current.error).toBeTruthy();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
