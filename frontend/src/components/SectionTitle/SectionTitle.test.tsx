import { render, screen } from '@testing-library/react';
import { SectionTitle } from './SectionTitle';

it('SectionTitle renders a heading with an optional count', () => {
  render(<SectionTitle title="Videolar" extra={3} />);
  expect(screen.getByRole('heading', { name: /Videolar/ })).toHaveTextContent('Videolar3');
});
