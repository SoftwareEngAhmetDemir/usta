import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { MachineSearch } from './MachineSearch';

const hit = { id: 2, code: 'FL-03', name: 'Forklift 3', location: 'Depo' };

it('MachineSearch links each found machine and reports typing', async () => {
  const onQueryChange = vi.fn();
  render(<MemoryRouter><MachineSearch query="" onQueryChange={onQueryChange} results={{ status: 'ok', data: [hit] }} onRetry={() => {}} /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'FL-03 · Forklift 3 · Depo' })).toHaveAttribute('href', '/m/2');
  await userEvent.type(screen.getByLabelText('Makine ara'), 'f');
  expect(onQueryChange).toHaveBeenCalledWith('f');
});

it('MachineSearch says when nothing matches', () => {
  render(<MemoryRouter><MachineSearch query="xyz" onQueryChange={() => {}} results={{ status: 'ok', data: [] }} onRetry={() => {}} /></MemoryRouter>);
  expect(screen.getByText('Bu aramayla makine bulunamadı.')).toBeInTheDocument();
});
