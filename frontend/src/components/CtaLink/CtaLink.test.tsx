import { render, screen } from '@testing-library/react';
import { Video } from 'lucide-react';
import { MemoryRouter } from 'react-router';
import { CtaLink } from './CtaLink';

it('CtaLink is one link with its title and hint', () => {
  render(<MemoryRouter><CtaLink to="/record" icon={Video} title="Video çek" hint="Bir makineyi anlat" /></MemoryRouter>);
  const link = screen.getByRole('link', { name: /Video çek/ });
  expect(link).toHaveAttribute('href', '/record');
  expect(link).toHaveTextContent('Bir makineyi anlat');
});
