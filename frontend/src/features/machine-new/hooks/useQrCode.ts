import { useEffect, useState } from 'react';
import { codeForQr } from '../api';

/** The machine code that comes with a scanned QR, for the form to show locked. null while it loads (or if it could
 * not be fetched: the backend sets it from the QR on save anyway); undefined when there is no QR. */
export function useQrCode(qr: string | undefined): string | null | undefined {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    if (!qr) return;
    let current = true;
    codeForQr(qr).then((r) => { if (current) setCode(r.code); }, () => undefined);
    return () => { current = false; };
  }, [qr]);
  return qr ? code : undefined;
}
