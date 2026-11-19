import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

it('EmptyState shows the message and the action', () => {
  render(<EmptyState message="Henüz video yok." action={<a href="/record">Video çek</a>} />);
  expect(screen.getByText('Henüz video yok.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Video çek' })).toBeInTheDocument();
});
