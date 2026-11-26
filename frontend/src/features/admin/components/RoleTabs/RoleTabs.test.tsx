import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleTabs } from './RoleTabs';

it('RoleTabs offers İşçi, Usta and Patron, marks the chosen one and reports a new choice', async () => {
  const onChange = vi.fn();
  render(<RoleTabs value="usta" onChange={onChange} />);
  expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['İşçi', 'Usta', 'Patron']);
  expect(screen.getByRole('button', { name: 'Usta' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'İşçi' })).toHaveAttribute('aria-pressed', 'false');
  await userEvent.click(screen.getByRole('button', { name: 'Patron' }));
  expect(onChange).toHaveBeenLastCalledWith('patron');
});
