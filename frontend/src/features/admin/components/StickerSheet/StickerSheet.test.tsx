import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { adminMachines } from '../../../../test/fixtures';
import { StickerSheet } from './StickerSheet';

it('StickerSheet shows one QR sticker per machine', () => {
  render(<StickerSheet machines={adminMachines.machines} excluded={new Set()} onToggle={() => {}} />);
  expect(screen.getByAltText('Forklift 3 QR kodu')).toHaveAttribute('src', '/api/machines/2/qr.svg');
  expect(screen.getByText('PK-105 · /m/1')).toBeInTheDocument();
});

it('StickerSheet ticks the machines that will be printed and reports a toggle', async () => {
  const onToggle = vi.fn();
  render(<StickerSheet machines={adminMachines.machines} excluded={new Set([2])} onToggle={onToggle} />);
  const forklift = screen.getByRole('checkbox', { name: 'Forklift 3 yazdır' });
  expect(screen.getByRole('checkbox', { name: 'Plazma Kesim Makinesi yazdır' })).toBeChecked();
  expect(forklift).not.toBeChecked();
  expect(forklift.closest('.label-card')).toHaveClass('no-print');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Plazma Kesim Makinesi yazdır' }));
  expect(onToggle).toHaveBeenCalledWith(1);
});
