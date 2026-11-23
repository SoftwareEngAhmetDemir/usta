import { render, screen } from '@testing-library/react';
import { MemoryRouter, Link } from 'react-router';
import { ListItem } from './ListItem';

it('ListItem is a plain row, or the whole row is the given link', () => {
  render(
    <MemoryRouter>
      <ListItem>Satır</ListItem>
      <ListItem asChild><Link to="/videos/1">Video</Link></ListItem>
    </MemoryRouter>,
  );
  expect(screen.getByText('Satır').tagName).toBe('DIV');
  expect(screen.getByRole('link', { name: 'Video' })).toHaveAttribute('href', '/videos/1');
});
