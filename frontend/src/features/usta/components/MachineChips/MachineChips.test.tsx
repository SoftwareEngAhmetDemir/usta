import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ustaProfile } from '../../../../test/fixtures';
import { MachineChips } from './MachineChips';

describe('MachineChips', () => {
  it('links each machine the usta knows', () => {
    render(<MemoryRouter><MachineChips machines={ustaProfile.machines} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'AB-01 · Abkant Pres' })).toHaveAttribute('href', '/m/4');
  });
  it('shows an empty message', () => {
    render(<MemoryRouter><MachineChips machines={[]} /></MemoryRouter>);
    expect(screen.getByText('Henüz bağlı makine yok.')).toBeInTheDocument();
  });
});
