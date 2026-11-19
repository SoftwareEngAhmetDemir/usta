import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AlertBell } from './AlertBell';

describe('AlertBell', () => {
  it('shows the unread count', () => {
    render(<MemoryRouter><AlertBell unread={3} /></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'Bildirimler, 3 okunmamış' });
    expect(link).toHaveAttribute('href', '/alerts');
    expect(link).toHaveTextContent('3');
  });
  it('has no count when all are read', () => {
    render(<MemoryRouter><AlertBell unread={0} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Bildirimler' })).not.toHaveTextContent(/\d/);
  });
});
