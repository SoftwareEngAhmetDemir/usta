import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NAV } from '../../nav';
import { NavBar } from './NavBar';

it('NavBar shows the role menu and marks the current screen', () => {
  render(<MemoryRouter initialEntries={['/my-questions']}><NavBar items={NAV.worker} /></MemoryRouter>);
  expect(screen.getByRole('link', { name: /Sorularım/ })).toHaveAttribute('aria-current', 'page');
  expect(screen.getAllByRole('link')).toHaveLength(3);
});
