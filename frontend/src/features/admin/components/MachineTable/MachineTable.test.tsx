import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { adminMachines } from '../../../../test/fixtures';
import { MachineTable } from './MachineTable';

describe('MachineTable', () => {
  it('shows ustas, last maintenance and counts, and opens the machine page', () => {
    render(<MemoryRouter><MachineTable rows={adminMachines.machines} /></MemoryRouter>);
    const [, first, second] = screen.getAllByRole('row');
    expect(first).toHaveTextContent('Mehmet Usta, Hasan Usta');
    expect(first).toHaveTextContent('14.11.2026 · Emre K.');
    expect(within(first!).getByRole('link', { name: 'Sayfayı aç' })).toHaveAttribute('href', '/m/1');
    expect(second).toHaveTextContent('—');
  });
  it('shows an empty message', () => {
    render(<MemoryRouter><MachineTable rows={[]} /></MemoryRouter>);
    expect(screen.getByText('Makine bulunamadı.')).toBeInTheDocument();
  });
});
