import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

it('Spinner announces loading', () => {
  render(<Spinner />);
  expect(screen.getByRole('status')).toHaveTextContent('Yükleniyor…');
});
