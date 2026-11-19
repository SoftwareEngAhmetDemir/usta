import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MaintenanceSection } from './MaintenanceSection';

describe('MaintenanceSection', () => {
  it('shows the empty message and the record button for technicians', () => {
    render(<MemoryRouter><MaintenanceSection machineId={2} records={[]} canRecord /></MemoryRouter>);
    expect(screen.getByText('Henüz bakım kaydı yok.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bakım kaydı/ })).toHaveAttribute('href', '/m/2/maintenance');
  });
  it('hides the record button for others', () => {
    render(<MemoryRouter><MaintenanceSection machineId={2} records={[]} canRecord={false} /></MemoryRouter>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('confirms a just-saved record', () => {
    render(<MemoryRouter><MaintenanceSection machineId={2} records={[]} canRecord={false} highlightId={5} /></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('Kaydedildi');
  });
});
