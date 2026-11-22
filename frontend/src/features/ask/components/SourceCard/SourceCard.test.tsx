import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { askAnswered } from '../../../../test/fixtures';
import { SourceCard } from './SourceCard';

const sources = askAnswered.status === 'answered' ? askAnswered.sources : [];

describe('SourceCard', () => {
  it('video source links to the player at that second', () => {
    render(<MemoryRouter><SourceCard source={sources[0]!} /></MemoryRouter>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/videos/1?t=108');
    expect(screen.getByText('VİDEO · 1:48')).toBeInTheDocument(); // label from the backend
    expect(screen.getByRole('link').querySelector('img')).toHaveAttribute('src', '/uploads/videos/1/snapshots/t2_0.jpg');
  });
  it('document source links to the PDF page', () => {
    render(<MemoryRouter><SourceCard source={sources[1]!} /></MemoryRouter>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/documents/1?page=37');
    expect(screen.getByRole('link')).toHaveTextContent('SAYFA 37 · 7. Bakım');
  });
  it('earlier usta answer shows who and when', () => {
    render(<MemoryRouter><SourceCard source={sources[2]!} /></MemoryRouter>);
    expect(screen.getByText('Mehmet Usta · 08.11.2026')).toBeInTheDocument();
  });
});
