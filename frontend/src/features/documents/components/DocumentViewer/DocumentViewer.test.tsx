import { render, screen } from '@testing-library/react';
import { documentDetail } from '../../../../test/fixtures';
import { DocumentViewer } from './DocumentViewer';

describe('DocumentViewer', () => {
  it('opens a PDF at the given page with download', () => {
    render(<DocumentViewer doc={documentDetail} page={37} />);
    expect(screen.getByTitle('PK-105 Kullanım Kılavuzu, sayfa 37')).toHaveAttribute('src', '/uploads/docs/pk105.pdf#page=37');
    expect(screen.getByRole('link', { name: 'İndir' })).toHaveAttribute('download');
  });
  it('shows images inline', () => {
    render(<DocumentViewer doc={{ ...documentDetail, mime_type: 'image/jpeg', file_url: '/uploads/a.jpg' }} page={1} />);
    expect(screen.getByAltText('PK-105 Kullanım Kılavuzu')).toHaveAttribute('src', '/uploads/a.jpg');
  });
});
