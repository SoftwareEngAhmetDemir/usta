import { act, renderHook } from '@testing-library/react';
import { useRecorder } from './useRecorder';

class FakeRecorder {
  static supported = ['video/webm'];
  static isTypeSupported = (t: string) => FakeRecorder.supported.includes(t);
  static last: FakeRecorder;
  mimeType: string;
  opts?: MediaRecorderOptions;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(_s: MediaStream, opts?: MediaRecorderOptions) {
    this.mimeType = opts?.mimeType ?? '';
    this.opts = opts;
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
    FakeRecorder.supported = ['video/webm'];
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
    expect(result.current.error).toBeNull();
    expect(result.current.clip).toMatchObject({ url: 'blob:clip', fileName: 'kayit.webm' });
    act(() => result.current.discard());
    expect(result.current.clip).toBeNull();
    vi.useRealTimers();
  });

  it('prefers WebM over MP4 when the browser offers both', () => {
    FakeRecorder.supported = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const { result } = renderHook(() => useRecorder({} as MediaStream));
    act(() => result.current.start());
    expect(FakeRecorder.last.mimeType).toBe('video/webm;codecs=vp8,opus');
  });

  it('caps the bitrate so 25 minutes stay about 300 MB', () => {
    const { result } = renderHook(() => useRecorder({} as MediaStream));
    act(() => result.current.start());
    const { videoBitsPerSecond = 0, audioBitsPerSecond = 0 } = FakeRecorder.last.opts ?? {};
    expect(videoBitsPerSecond).toBe(1_500_000);
    expect(((videoBitsPerSecond + audioBitsPerSecond) * 25 * 60) / 8 / 1e6).toBeLessThan(320);
  });

  it('records MP4 where WebM is missing', () => {
    FakeRecorder.supported = ['video/mp4'];
    const { result } = renderHook(() => useRecorder({} as MediaStream));
    act(() => result.current.start());
    act(() => FakeRecorder.last.stop());
    expect(result.current.clip?.fileName).toBe('kayit.mp4');
  });

  it('says so when the browser stops the recording on its own', () => {
    const { result } = renderHook(() => useRecorder({} as MediaStream));
    act(() => result.current.start());
    act(() => FakeRecorder.last.stop()); // not via the stop button
    expect(result.current.recording).toBe(false);
    expect(result.current.error).toMatch(/kendiliğinden durdu/);
    expect(result.current.clip).not.toBeNull();
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
