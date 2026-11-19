import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordControls } from './RecordControls';

const fns = () => ({ onOpenCamera: vi.fn(), onStart: vi.fn(), onStop: vi.fn(), onFlip: vi.fn(), onPick: vi.fn() });

describe('RecordControls', () => {
  it('explains the permission and opens the camera', async () => {
    const f = fns();
    render(<RecordControls cameraOn={false} recording={false} {...f} />);
    expect(screen.getByText(/kamera ve mikrofon izni/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Kamerayı aç/ }));
    expect(f.onOpenCamera).toHaveBeenCalled();
  });
  it('starts, flips and picks a file', async () => {
    const f = fns();
    render(<RecordControls cameraOn recording={false} {...f} />);
    await userEvent.click(screen.getByRole('button', { name: 'Kaydı başlat' }));
    await userEvent.click(screen.getByRole('button', { name: /Kamerayı çevir/ }));
    const file = new File(['v'], 'a.mp4', { type: 'video/mp4' });
    await userEvent.upload(screen.getByLabelText(/telefondan video seç/), file);
    expect(f.onStart).toHaveBeenCalled();
    expect(f.onFlip).toHaveBeenCalled();
    expect(f.onPick).toHaveBeenCalledWith(file);
  });
  it('shows only stop while recording', async () => {
    const f = fns();
    render(<RecordControls cameraOn recording {...f} />);
    expect(screen.queryByLabelText(/telefondan/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Kaydı durdur' }));
    expect(f.onStop).toHaveBeenCalled();
  });
});
