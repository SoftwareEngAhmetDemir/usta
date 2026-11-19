import { render, screen } from '@testing-library/react';
import { CameraView } from './CameraView';

describe('CameraView', () => {
  it('shows the running timer while recording', () => {
    render(<CameraView stream={{} as MediaStream} previewUrl={null} recordingSec={65} />);
    expect(screen.getByRole('timer')).toHaveTextContent('REC 1:05');
    expect(screen.getByLabelText('Kamera görüntüsü')).toBeInTheDocument();
  });
  it('plays back the recording', () => {
    render(<CameraView stream={null} previewUrl="blob:x" recordingSec={null} />);
    expect(screen.getByLabelText('Kaydın önizlemesi')).toHaveAttribute('src', 'blob:x');
  });
});
