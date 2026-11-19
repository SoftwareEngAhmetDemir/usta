import { formatDate, formatDateTime, formatDuration } from './format';

describe('format', () => {
  it('formats durations as m:ss or h:mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(108)).toBe('1:48');
    expect(formatDuration(3725)).toBe('1:02:05');
    expect(formatDuration(-3)).toBe('0:00');
  });
  it('formats dates in Turkish order', () => {
    expect(formatDate('2026-11-14T09:40:00')).toBe('14.11.2026');
    expect(formatDateTime('2026-11-14T09:40:00')).toMatch(/^14\.11\.2026 09:40$/);
  });
});
