import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NotFoundDialog } from './NotFoundDialog';

describe('NotFoundDialog', () => {
  it('names the code that matched no machine and closes on "Tekrar tara"', async () => {
    const onClose = vi.fn();
    render(<NotFoundDialog code="XX-1" onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Makine bulunamadı' })).toHaveTextContent('XX-1');
    await userEvent.click(screen.getByRole('button', { name: 'Tekrar tara' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(<NotFoundDialog code="XX-1" onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is hidden without a code', () => {
    render(<NotFoundDialog code={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
