import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { VideoList } from './VideoList';

const video = { id: 1, title: 'Hava basıncı', author_name: 'Hasan Usta', created_at: '2026-11-04T10:00:00', duration_sec: 155, thumbnail_url: null, status: 'ready' as const, availability: 'dubbed' as const };
const ext = { id: 2, title: 'Üretici videosu', url: 'https://x', embed_url: null, source: 'manufacturer' as const };

describe('VideoList', () => {
  it('lists usta and outside videos with a count', () => {
    render(<MemoryRouter><VideoList machineId={1} videos={[video]} external={[ext]} languageName="English" canRecord={false} /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /Videolar/ })).toHaveTextContent('2');
    expect(screen.getByText('English dublaj')).toBeInTheDocument();
    expect(screen.getByText('Üretici videosu')).toBeInTheDocument();
  });
  it('shows the empty message, with "Video çek" only for ustas/patron', () => {
    const { rerender } = render(<MemoryRouter><VideoList machineId={1} videos={[]} external={[]} languageName="Türkçe" canRecord={false} /></MemoryRouter>);
    expect(screen.getByText('Henüz video yok.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Video çek' })).not.toBeInTheDocument();
    rerender(<MemoryRouter><VideoList machineId={1} videos={[]} external={[]} languageName="Türkçe" canRecord /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Video çek' })).toHaveAttribute('href', '/record?machine=1');
  });
});
