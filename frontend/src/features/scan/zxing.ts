import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

let ready: Promise<void> | null = null;

/** Where the browser has no BarcodeDetector (iPhone Safari, Firefox), install ZXing-C++ (WebAssembly) as one, so
 * qr-scanner decodes with it instead of its jsQR-based worker, which misses QR printed on paper or cardboard (low
 * contrast, a little blur). The .wasm comes from our own server, not the package's default CDN. Call before
 * `new QrScanner` / `QrScanner.scanImage`: the library picks its decoder then. Never rejects: on failure the
 * library's own worker stays. */
export function installZxing(): Promise<void> {
  ready ??= (async () => {
    if ('BarcodeDetector' in window) return; // Android Chrome: ML Kit, already strong on paper
    const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill');
    await prepareZXingModule({
      overrides: { locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
      fireImmediately: true,
    });
    Object.assign(window, { BarcodeDetector });
  })().catch(() => undefined);
  return ready;
}
