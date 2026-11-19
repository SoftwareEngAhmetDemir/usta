import { screen } from '@testing-library/react';
import { documentDetail, me } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { DocumentPage } from './DocumentPage';

describe('DocumentPage (KAN-33, KAN-45)', () => {
  it('shows the summary and opens the PDF at the cited page', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /documents/1': documentDetail });
    renderAuthed(<DocumentPage />, '/documents/1?page=37', '/documents/:documentId');
    expect(await screen.findByText('Kesimden önce hava basıncı 5,9–6,2 bar olmalı (s. 22).')).toBeInTheDocument();
    expect(screen.getByTitle(/sayfa 37/)).toHaveAttribute('src', '/uploads/docs/pk105.pdf#page=37');
    expect(screen.getByText(/Kullanım kılavuzu · 84 sayfa/)).toBeInTheDocument();
  });
});
