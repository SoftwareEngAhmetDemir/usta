import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { DocumentSummary } from '../../../../api';
import { DocumentList } from './DocumentList';

const doc: DocumentSummary = { id: 4, title: 'PK-105 Kılavuz', type: 'user_manual', page_count: 84, summary_status: 'ready', summary_preview: { text: 'Hava basıncı 6 bar olmalı.', lang: 'tr', dir: 'ltr' } };

describe('DocumentList', () => {
  it('shows type, pages and the summary under the document (KAN-45)', () => {
    render(<MemoryRouter><DocumentList machineId={1} documents={[doc, { ...doc, id: 5, title: 'Katalog', type: 'catalog', summary_status: 'preparing', summary_preview: null }]} canUpload={false} /></MemoryRouter>);
    const link = screen.getByRole('link', { name: /PK-105 Kılavuz/ });
    expect(link).toHaveAttribute('href', '/documents/4');
    expect(link).toHaveTextContent('Kullanım kılavuzu · 84 sayfa');
    expect(link).toHaveTextContent('Hava basıncı 6 bar olmalı.');
    expect(screen.getByText('Özet hazırlanıyor')).toBeInTheDocument();
  });
  it('shows an empty message with "Belge yükle" for the patron', () => {
    render(<MemoryRouter><DocumentList machineId={2} documents={[]} canUpload /></MemoryRouter>);
    expect(screen.getByText('Henüz doküman yok.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Belge yükle' })).toHaveAttribute('href', '/panel?machine=2');
  });
});
