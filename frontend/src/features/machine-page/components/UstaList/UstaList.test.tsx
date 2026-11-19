import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { UstaList } from './UstaList';

describe('UstaList', () => {
  it('links each usta to his profile', () => {
    render(<MemoryRouter><UstaList ustas={[{ id: 7, name: 'Mehmet Usta' }]} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Mehmet Usta/ })).toHaveAttribute('href', '/ustas/7');
  });
  it('shows an empty message', () => {
    render(<MemoryRouter><UstaList ustas={[]} /></MemoryRouter>);
    expect(screen.getByText('Henüz bağlı usta yok.')).toBeInTheDocument();
  });
});
