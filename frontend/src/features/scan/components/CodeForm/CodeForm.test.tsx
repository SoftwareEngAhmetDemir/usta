import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeForm } from './CodeForm';

it('CodeForm sends the code upper-cased', async () => {
  const onSubmit = vi.fn();
  render(<CodeForm pending={false} onSubmit={onSubmit} />);
  await userEvent.type(screen.getByLabelText(/makine kodunu/), ' pk-105 ');
  await userEvent.click(screen.getByRole('button', { name: 'Aç' }));
  expect(onSubmit).toHaveBeenCalledWith('PK-105');
});
