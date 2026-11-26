import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../../../api';
import { DeleteContentDialog } from './DeleteContentDialog';

const target = { kind: 'documents' as const, id: 4, title: 'PK-105 Kılavuz' };

describe('DeleteContentDialog', () => {
  it('is closed without a target', () => {
    render(<DeleteContentDialog open target={null} pending={false} error={null} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('is closed when open is false, even with a target kept', () => {
    render(<DeleteContentDialog open={false} target={target} pending={false} error={null} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('names what is deleted, confirms or cancels', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<DeleteContentDialog open target={target} pending={false} error={null} onConfirm={onConfirm} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Doküman silinsin mi?' })).toHaveTextContent('PK-105 Kılavuz');
    await userEvent.click(screen.getByRole('button', { name: 'Evet, sil' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Vazgeç' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('says "video" for a video and shows the error', () => {
    render(<DeleteContentDialog open target={{ ...target, kind: 'videos' }} pending={false} error={new ApiError(403, { detail: 'Bu işlem için yetkiniz yok.' })} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Video silinsin mi?' })).toBeInTheDocument();
    expect(screen.getByText('Bu işlem için yetkiniz yok.')).toBeInTheDocument();
  });
});
