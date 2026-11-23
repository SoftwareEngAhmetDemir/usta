import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link } from 'react-router';
import { Chip } from './Chip';

it('Chip is a non-submit toggle button that reports its pressed state', async () => {
  const onClick = vi.fn();
  render(<Chip aria-pressed onClick={onClick}>Usta</Chip>);
  const chip = screen.getByRole('button', { name: 'Usta' });
  expect(chip).toHaveAttribute('type', 'button');
  expect(chip).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(chip);
  expect(onClick).toHaveBeenCalledOnce();
});

it('Chip asChild styles a link instead of rendering a button', () => {
  render(<MemoryRouter><Chip asChild><Link to="/m/1">PK-105</Link></Chip></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'PK-105' })).toHaveAttribute('href', '/m/1');
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
