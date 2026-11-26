import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrashButton } from './TrashButton';

it('TrashButton is a named button that calls onClick', async () => {
  const onClick = vi.fn();
  render(<TrashButton label="Sil: Kılavuz" onClick={onClick} />);
  await userEvent.click(screen.getByRole('button', { name: 'Sil: Kılavuz' }));
  expect(onClick).toHaveBeenCalledOnce();
});
