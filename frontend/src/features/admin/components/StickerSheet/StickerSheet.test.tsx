import { render, screen } from '@testing-library/react';
import { adminMachines } from '../../../../test/fixtures';
import { StickerSheet } from './StickerSheet';

it('StickerSheet shows one QR sticker per machine', () => {
  render(<StickerSheet machines={adminMachines.machines} />);
  expect(screen.getByAltText('Forklift 3 QR kodu')).toHaveAttribute('src', '/api/machines/2/qr.svg');
  expect(screen.getByText('PK-105 · /m/1')).toBeInTheDocument();
});
