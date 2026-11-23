import { render, screen } from '@testing-library/react';
import { PageSkeleton } from './PageSkeleton';

it('PageSkeleton is a busy status named in the new language', () => {
  render(<PageSkeleton languageName="Deutsch" />);
  const status = screen.getByRole('status');
  expect(status).toHaveAttribute('aria-busy', 'true');
  expect(status).toHaveTextContent('Deutsch…');
});
