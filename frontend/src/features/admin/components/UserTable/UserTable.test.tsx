import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { adminUsers } from '../../../../test/fixtures';
import { UserTable } from './UserTable';

it('UserTable shows role, authorized status with document, and machines', () => {
  render(<MemoryRouter><UserTable users={adminUsers} /></MemoryRouter>);
  const [, usta, tech] = screen.getAllByRole('row');
  expect(usta).toHaveTextContent('Usta');
  expect(usta).toHaveTextContent('Plazma Kesim Makinesi');
  expect(tech).toHaveTextContent('TeknisyenYetkili');
  expect(screen.getByRole('link', { name: 'Belge' })).toHaveAttribute('href', '/uploads/certs/emre.pdf');
});

it('UserTable links an usta to their profile (machines → videos and documents), others not', () => {
  render(<MemoryRouter><UserTable users={adminUsers} /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Mehmet Usta' })).toHaveAttribute('href', '/ustas/7');
  expect(screen.queryByRole('link', { name: 'Emre K.' })).not.toBeInTheDocument();
});
