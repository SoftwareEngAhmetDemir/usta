import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { VideoSummary } from '../../../../api';
import { VideoItem } from './VideoItem';

const v: VideoSummary = { id: 3, title: 'Meme ve elektrot değişimi', author_name: 'Mehmet Usta', created_at: '2026-11-12T10:00:00', duration_sec: 252, thumbnail_url: null, status: 'ready', availability: 'on_demand' };
const r = (video: VideoSummary) => render(<MemoryRouter><VideoItem video={video} languageName="العربية" /></MemoryRouter>);

describe('VideoItem', () => {
  it('links a ready video with title, author, date and duration', () => {
    r(v);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/videos/3');
    expect(link).toHaveTextContent('Mehmet Usta · 12.11.2026');
    expect(link).toHaveTextContent('4:12');
    expect(screen.getByText('العربية: istenince hazırlanır')).toBeInTheDocument();
  });
  it('does not link a video that is still processing', () => {
    r({ ...v, status: 'processing' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('İşleniyor')).toBeInTheDocument();
  });
  it('adds a trash button beside a ready video\'s link, none while processing', async () => {
    const onDelete = vi.fn();
    const { unmount } = render(<MemoryRouter><VideoItem video={v} languageName="Türkçe" onDelete={onDelete} /></MemoryRouter>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/videos/3');
    await userEvent.click(screen.getByRole('button', { name: 'Sil: Meme ve elektrot değişimi' }));
    expect(onDelete).toHaveBeenCalledOnce();
    unmount();
    render(<MemoryRouter><VideoItem video={{ ...v, status: 'processing' }} languageName="Türkçe" onDelete={onDelete} /></MemoryRouter>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
