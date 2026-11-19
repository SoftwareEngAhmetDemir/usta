import { act, renderHook } from '@testing-library/react';
import { useRecorder } from './useRecorder';

class FakeRecorder {
  static isTypeSupported = (t: string) => t === 'video/webm';
  static last: FakeRecorder;
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(_s: MediaStream, opts?: { mimeType: string }) {
    this.mimeType = opts?.mimeType ?? '';
    FakeRecorder.last = this;
  }
  start() {}
  stop() {
    this.ondataavailable?.({ data: new Blob(['abc']) });
    this.onstop?.();
  }
}

describe('useRecorder', () => {
  beforeEach(() => {
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:clip', revokeObjectURL: vi.fn() }));
  });

  it('records with a supported type, counts seconds and produces a clip', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRecorder({} as MediaStream));
    act(() => result.current.start());
    expect(FakeRecorder.last.mimeType).toBe('video/webm');
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.seconds).toBe(3);
    act(() => result.current.stop());
    expect(result.current.recording).toBe(false);
    expect(result.current.clip).toMatchObject({ url: 'blob:clip', fileName: 'kayit.webm' });
    act(() => result.current.discard());
    expect(result.current.clip).toBeNull();
    vi.useRealTimers();
  });

  it('accepts a video from the phone and rejects other files', () => {
    const { result } = renderHook(() => useRecorder(null));
    act(() => result.current.pick(new File(['x'], 'a.pdf', { type: 'application/pdf' })));
    expect(result.current.error).toMatch(/video değil/);
    act(() => result.current.pick(new File(['x'], 'servis.mov', { type: 'video/quicktime' })));
    expect(result.current.error).toBeNull();
    expect(result.current.clip?.fileName).toBe('servis.mov');
  });
});
