import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { stubQrCamera } from '../../../../test/utils';
import { QrScanner } from './QrScanner';

describe('QrScanner', () => {
  it('reads a QR from the back camera and reports it once', async () => {
    stubQrCamera('https://usta.example/m/7');
    const onCode = vi.fn();
    render(<QrScanner onCode={onCode} />);
    expect(screen.getByLabelText('QR kamerası')).toBeInTheDocument();
    await waitFor(() => expect(onCode).toHaveBeenCalledWith('https://usta.example/m/7'));
    await new Promise((r) => setTimeout(r, 700)); // more scans of the same QR
    expect(onCode).toHaveBeenCalledTimes(1);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'environment' } });
  });

  it('explains that plain http blocks the camera', () => {
    vi.stubGlobal('isSecureContext', false);
    render(<QrScanner onCode={vi.fn()} />);
    expect(screen.getByText(/yalnızca güvenli \(https\) bağlantıda/)).toBeInTheDocument();
    expect(screen.queryByLabelText('QR kamerası')).not.toBeInTheDocument();
  });

  it('points iPhone Safari (no BarcodeDetector) to the phone camera', () => {
    stubQrCamera(null);
    render(<QrScanner onCode={vi.fn()} />);
    expect(screen.getByText(/Bu tarayıcı QR okuyamıyor/)).toBeInTheDocument();
  });

  it('says when camera permission is refused', async () => {
    stubQrCamera('x', () => Promise.reject(new DOMException('no', 'NotAllowedError')));
    render(<QrScanner onCode={vi.fn()} />);
    expect(await screen.findByText(/Kamera izni verilmedi/)).toBeInTheDocument();
  });
});
