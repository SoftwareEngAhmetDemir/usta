import type { BarcodeFormat } from 'barcode-detector/ponyfill';
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

/** The codes read, not only QR: tags and boxes also carry Data Matrix (a medicine box's GS1 code, seen 2026-11-25),
 * Aztec and PDF417. qr-scanner asks its decoder for QR alone; `installZxing` overrides that. */
export const CODE_FORMATS: BarcodeFormat[] = ['qr_code', 'data_matrix', 'aztec', 'pdf417'];

let ready: Promise<void> | null = null;

/** Install ZXing-C++ (WebAssembly) as `window.BarcodeDetector` on every browser, reading `CODE_FORMATS` whatever
 * qr-scanner asks for. Also replaces Android's native detector: one decoder means the same text for the same code on
 * every phone (a GS1 code is "(01)…(21)…" here; native detectors return it differently), and the lookup matches it
 * exactly. Without it, iPhone Safari and Firefox fall back to qr-scanner's jsQR worker, which misses QR printed on paper
 * or cardboard. The .wasm comes from our own server, not the package's default CDN. Call before `new QrScanner` /
 * `QrScanner.scanImage`: the library picks its decoder then. Never rejects: on failure the browser's or the library's
 * own decoder stays (QR only). */
export function installZxing(): Promise<void> {
  ready ??= (async () => {
    const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill');
    await prepareZXingModule({
      overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
      fireImmediately: true,
    });
    class AnyCode extends BarcodeDetector {
      constructor() { super({ formats: CODE_FORMATS }); }
    }
    Object.assign(window, { BarcodeDetector: AnyCode });
  })().catch(() => undefined);
  return ready;
}
