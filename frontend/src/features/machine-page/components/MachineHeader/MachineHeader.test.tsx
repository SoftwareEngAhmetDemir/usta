import { render, screen } from '@testing-library/react';
import { MachineHeader } from './MachineHeader';

const m = { id: 1, code: 'PK-105', name: 'Plazma Kesim Makinesi', type: 'Plazma kesim', model: 'PK-105', serial: 'PK105-22871', location: 'Atölye A', photo_url: null };

describe('MachineHeader', () => {
  it('shows name, type, model, serial and location', () => {
    render(<MachineHeader machine={m} />);
    expect(screen.getByRole('heading', { name: 'Plazma Kesim Makinesi' })).toBeInTheDocument();
    for (const v of ['Plazma kesim', 'PK105-22871', 'Atölye A']) expect(screen.getByText(v)).toBeInTheDocument();
  });
  it('shows the photo when there is one', () => {
    render(<MachineHeader machine={{ ...m, photo_url: '/uploads/m1.jpg' }} />);
    expect(screen.getByAltText('Plazma Kesim Makinesi')).toHaveAttribute('src', '/uploads/m1.jpg');
  });
});
