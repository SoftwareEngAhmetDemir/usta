import { beforeEach, vi } from 'vitest';

const prepare = vi.fn(async () => ({}));
class ZxingDetector {}
vi.mock('barcode-detector/ponyfill', () => ({ BarcodeDetector: ZxingDetector, prepareZXingModule: prepare }));
vi.mock('zxing-wasm/reader/zxing_reader.wasm?url', () => ({ default: '/assets/zxing_reader-abc.wasm' }));

// installZxing runs once per page load, so each test gets a fresh copy of the module.
const load = async () => (await import('./zxing')).installZxing;

beforeEach(() => { vi.resetModules(); prepare.mockClear(); });

describe('installZxing', () => {
  it('installs ZXing as BarcodeDetector where the browser has none, with the .wasm from our own server', async () => {
    Reflect.deleteProperty(window, 'BarcodeDetector');
    await (await load())();
    expect(Reflect.get(window, 'BarcodeDetector')).toBe(ZxingDetector);
    const options = prepare.mock.calls.at(0)?.at(0) as { overrides: { locateFile: (p: string, prefix: string) => string } } | undefined;
    expect(options?.overrides.locateFile('zxing_reader.wasm', 'https://cdn.example/')).toBe('/assets/zxing_reader-abc.wasm');
    Reflect.deleteProperty(window, 'BarcodeDetector');
  });

  it('keeps the native BarcodeDetector (Android Chrome)', async () => {
    class Native {}
    vi.stubGlobal('BarcodeDetector', Native);
    await (await load())();
    expect(Reflect.get(window, 'BarcodeDetector')).toBe(Native);
    expect(prepare).not.toHaveBeenCalled();
  });

  it('never rejects: if the .wasm cannot load, qr-scanner keeps its own decoder', async () => {
    Reflect.deleteProperty(window, 'BarcodeDetector');
    prepare.mockRejectedValueOnce(new Error('404'));
    await expect((await load())()).resolves.toBeUndefined();
    expect('BarcodeDetector' in window).toBe(false);
  });
});
