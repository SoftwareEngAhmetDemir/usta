import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { fakeQr } from '../../../../test/fakeQrScanner';
import { stubQrCamera } from '../../../../test/utils';
import { QrScanner } from './QrScanner';

vi.mock('qr-scanner', () => import('../../../../test/fakeQrScanner'));
vi.mock('../../zxing', () => ({ installZxing: async () => undefined }));

const photo = () => new File(['x'], 'qr.jpg', { type: 'image/jpeg' });
const bitmap = () => vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4000, height: 3000, close: vi.fn() })));

describe('QrScanner', () => {
  it('reads a QR from the back camera and reports it once', async () => {
    stubQrCamera('https://usta.example/m/7');
    const onCode = vi.fn();
    render(<QrScanner onCode={onCode} />);
    expect(screen.getByLabelText('QR kamerası')).toBeInTheDocument();
    await waitFor(() => expect(onCode).toHaveBeenCalledWith('https://usta.example/m/7'));
    await new Promise((r) => setTimeout(r, 400)); // the camera still sees the same QR
    expect(onCode).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('QR’ı çerçevenin içine getirin');
  });

  it('waits to open the camera until the viewfinder is on screen (hidden under the language skeleton)', async () => {
    stubQrCamera('https://usta.example/m/7', undefined, false);
    render(<QrScanner onCode={vi.fn()} />);
    await new Promise((r) => setTimeout(r, 200));
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Kamera açılıyor');
  });

  it('offers the torch where the camera has one and switches it on and off', async () => {
    stubQrCamera(null);
    fakeQr.torch = true;
    render(<QrScanner onCode={vi.fn()} />);
    const torch = await screen.findByRole('button', { name: 'Fener' });
    expect(torch).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(torch);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fener' })).toHaveAttribute('aria-pressed', 'true'));
    await userEvent.click(screen.getByRole('button', { name: 'Fener' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fener' })).toHaveAttribute('aria-pressed', 'false'));
  });

  it('shows no torch button where there is none (iPhone)', async () => {
    stubQrCamera(null);
    render(<QrScanner onCode={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('QR’ı çerçevenin içine getirin'));
    expect(screen.queryByRole('button', { name: 'Fener' })).not.toBeInTheDocument();
  });

  it('switches to the main back lens on Android (Samsung may open the fixed-focus ultra-wide)', async () => {
    stubQrCamera(null);
    fakeQr.cameras = [{ id: 'wide', label: 'camera2 2, facing back' }, { id: 'main', label: 'camera2 0, facing back' }];
    render(<QrScanner onCode={vi.fn()} />);
    await waitFor(() => expect(fakeQr.switchedTo).toEqual(['main']));
  });

  it('keeps the browser’s lens on iPhone', async () => {
    stubQrCamera(null);
    fakeQr.cameras = [{ id: 'a', label: 'Back Camera' }, { id: 'b', label: 'Back Ultra Wide Camera' }];
    render(<QrScanner onCode={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('QR’ı çerçevenin içine getirin'));
    await new Promise((r) => setTimeout(r, 50));
    expect(fakeQr.switchedTo).toEqual([]);
  });

  it('opens the camera after a moment when it is still busy (no page reload)', async () => {
    let calls = 0;
    stubQrCamera('https://usta.example/m/7', async () => {
      calls += 1;
      if (calls === 1) throw new DOMException('busy', 'NotReadableError');
      return { getTracks: () => [] } as unknown as MediaStream;
    });
    const onCode = vi.fn();
    render(<QrScanner onCode={onCode} />);
    await waitFor(() => expect(onCode).toHaveBeenCalledWith('https://usta.example/m/7'), { timeout: 3000 });
    expect(calls).toBe(2);
  });

  it('offers to reopen the camera when it stays unavailable, and scans after that', async () => {
    let free = false;
    stubQrCamera('https://usta.example/m/7', async () => {
      if (!free) throw new DOMException('busy', 'NotReadableError');
      return { getTracks: () => [] } as unknown as MediaStream;
    });
    const onCode = vi.fn();
    render(<QrScanner onCode={onCode} />);
    const reopen = await screen.findByRole('button', { name: 'Kamerayı yeniden aç' }, { timeout: 5000 });
    expect(screen.getByRole('status')).toHaveTextContent('Kamera açılamadı');
    free = true;
    await userEvent.click(reopen);
    await waitFor(() => expect(onCode).toHaveBeenCalledWith('https://usta.example/m/7'));
    expect(screen.queryByRole('button', { name: 'Kamerayı yeniden aç' })).not.toBeInTheDocument();
  }, 10000);

  it('lets go of the camera at once when the page is left', async () => {
    stubQrCamera(null);
    const { unmount } = render(<QrScanner onCode={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('QR’ı çerçevenin içine getirin'));
    unmount();
    expect(fakeQr.releasedNow).toBe(1);
  });

  it('reports nothing while paused', async () => {
    stubQrCamera('https://usta.example/m/7');
    const onCode = vi.fn();
    render(<QrScanner onCode={onCode} paused />);
    await new Promise((r) => setTimeout(r, 400));
    expect(onCode).not.toHaveBeenCalled();
  });

  it('says when camera permission is refused', async () => {
    stubQrCamera('x', () => Promise.reject(new DOMException('no', 'NotAllowedError')));
    render(<QrScanner onCode={vi.fn()} />);
    expect(await screen.findByText(/Kamera izni verilmedi/)).toBeInTheDocument();
  });

  it('explains that plain http blocks the live camera and offers the photo instead', () => {
    vi.stubGlobal('isSecureContext', false);
    render(<QrScanner onCode={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(/Canlı kamera yalnızca https bağlantıda açılır/);
    expect(screen.queryByLabelText('QR kamerası')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Fotoğraf çekerek oku')).toHaveAttribute('capture', 'environment');
  });

  it('reads the QR from a photo on plain http (no live camera there)', async () => {
    vi.stubGlobal('isSecureContext', false);
    bitmap();
    fakeQr.photo = 'https://usta.example/m/9';
    const onCode = vi.fn();
    render(<QrScanner onCode={onCode} />);
    await userEvent.upload(screen.getByLabelText('Fotoğraf çekerek oku'), photo());
    await waitFor(() => expect(onCode).toHaveBeenCalledWith('https://usta.example/m/9'));
  });

  it('says so when the photo has no QR', async () => {
    vi.stubGlobal('isSecureContext', false);
    bitmap();
    const onCode = vi.fn();
    render(<QrScanner onCode={onCode} />);
    await userEvent.upload(screen.getByLabelText('Fotoğraf çekerek oku'), photo());
    expect(await screen.findByRole('status')).toHaveTextContent('Fotoğrafta QR bulunamadı');
    expect(onCode).not.toHaveBeenCalled();
  });
});
