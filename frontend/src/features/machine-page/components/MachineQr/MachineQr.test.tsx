import { render, screen } from '@testing-library/react';
import { MachineQr } from './MachineQr';

it('MachineQr shows the QR image and links its printable sticker', () => {
  render(<MachineQr machineId={4} name="Forklift 3" />);
  expect(screen.getByAltText('Forklift 3 QR kodu')).toHaveAttribute('src', '/api/machines/4/qr.svg');
  expect(screen.getByRole('link', { name: 'Etiketi yazdır (PDF)' })).toHaveAttribute('href', '/api/machines/4/sticker.pdf');
});
