import { act, renderHook } from '@testing-library/react';
import { HD, useCamera } from './useCamera';

const track = { stop: vi.fn() };
const stream = { getTracks: () => [track] } as unknown as MediaStream;

describe('useCamera', () => {
  it('opens the back camera, flips to the front one and stops tracks on unmount', async () => {
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    const { result, unmount } = renderHook(() => useCamera());
    await act(() => result.current.start());
    expect(getUserMedia).toHaveBeenLastCalledWith({ video: { facingMode: 'environment', ...HD }, audio: true });
    await act(() => result.current.flip());
    expect(getUserMedia).toHaveBeenLastCalledWith({ video: { facingMode: 'user', ...HD }, audio: true });
    unmount();
    expect(track.stop).toHaveBeenCalled();
  });

  it('explains a denied permission in Turkish', async () => {
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn().mockRejectedValue(new DOMException('no', 'NotAllowedError')) } });
    const { result } = renderHook(() => useCamera());
    await act(() => result.current.start());
    expect(result.current.error).toMatch(/izni verilmedi/);
    expect(result.current.stream).toBeNull();
  });
});
