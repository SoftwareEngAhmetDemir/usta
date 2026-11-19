import { render, screen } from '@testing-library/react';
import { AuthorizedBadge } from './AuthorizedBadge';

const base = { id: 1, name: 'Emre', authorized: true, authorization_document_url: null };

describe('AuthorizedBadge', () => {
  it('shows nothing for a non-authorized person', () => {
    const { container } = render(<AuthorizedBadge person={{ ...base, authorized: false }} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('shows the badge, linking the document when present', () => {
    render(<AuthorizedBadge person={{ ...base, authorization_document_url: '/uploads/cert.pdf' }} />);
    expect(screen.getByRole('link', { name: 'Yetkili' })).toHaveAttribute('href', '/uploads/cert.pdf');
  });
});
