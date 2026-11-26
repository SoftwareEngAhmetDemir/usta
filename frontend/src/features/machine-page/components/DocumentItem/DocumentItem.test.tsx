import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { DocumentSummary } from '../../../../api';
import { DocumentItem } from './DocumentItem';

const doc: DocumentSummary = { id: 4, title: 'PK-105 Kılavuz', type: 'user_manual', page_count: 84, summary_status: 'ready', summary_preview: null };
const r = (onDelete?: () => void, d: DocumentSummary = doc) => render(<MemoryRouter><DocumentItem document={d} onDelete={onDelete} /></MemoryRouter>);

describe('DocumentItem', () => {
  it('opens the document and has no trash button without onDelete', () => {
    r();
    expect(screen.getByRole('link', { name: /PK-105 Kılavuz/ })).toHaveAttribute('href', '/documents/4');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('keeps the link and adds a trash button beside it with onDelete', async () => {
    const onDelete = vi.fn();
    r(onDelete);
    expect(screen.getByRole('link', { name: /PK-105 Kılavuz/ })).toHaveAttribute('href', '/documents/4');
    await userEvent.click(screen.getByRole('button', { name: 'Sil: PK-105 Kılavuz' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
  it('has no trash button while the document is still being read', () => {
    r(vi.fn(), { ...doc, summary_status: 'preparing' });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
