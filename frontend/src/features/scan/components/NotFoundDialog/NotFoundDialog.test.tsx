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

describe('NotFoundDialog for someone who may add machines', () => {
  it('asks whether to add a machine with the new QR', async () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    render(<NotFoundDialog code="TAG-77" onAdd={onAdd} onClose={onClose} />);
    const dialog = screen.getByRole('dialog', { name: 'Yeni QR' });
    expect(dialog).toHaveTextContent('Bu QR ile yeni bir makine eklemek ister misiniz?');
    expect(dialog).toHaveTextContent('TAG-77');
    await userEvent.click(screen.getByRole('button', { name: 'Evet, makine ekle' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Hayır, tekrar tara' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('speaks of a code, not a QR, when it was typed', () => {
    render(<NotFoundDialog code="PK-200" typed onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Yeni makine kodu' })).toHaveTextContent('Bu kodla yeni bir makine eklemek ister misiniz?');
  });
});
