import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PageTitle } from './PageTitle';

describe('PageTitle', () => {
  it('renders an h1 and no back button by default', () => {
    render(<MemoryRouter><PageTitle title="Makine" /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: 'Makine' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Geri' })).not.toBeInTheDocument();
  });
  it('shows a back button when asked', () => {
    render(<MemoryRouter><PageTitle title="Video" back /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Geri' })).toBeInTheDocument();
  });
});
