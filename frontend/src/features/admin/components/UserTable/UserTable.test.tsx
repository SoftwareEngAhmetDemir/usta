import { render, screen } from '@testing-library/react';
import { adminUsers } from '../../../../test/fixtures';
import { UserTable } from './UserTable';

it('UserTable shows role, authorized status with document, and machines', () => {
  render(<UserTable users={adminUsers} />);
  const [, usta, tech] = screen.getAllByRole('row');
  expect(usta).toHaveTextContent('Usta');
  expect(usta).toHaveTextContent('Plazma Kesim Makinesi');
  expect(tech).toHaveTextContent('TeknisyenYetkili');
  expect(screen.getByRole('link', { name: 'Belge' })).toHaveAttribute('href', '/uploads/certs/emre.pdf');
});
