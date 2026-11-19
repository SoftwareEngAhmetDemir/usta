import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertList } from './AlertList';

const a = { id: 1, text: 'Cevap geldi', created_at: '2026-11-19T10:00:00', read: false, path: '/my-questions' };

describe('AlertList', () => {
  it('shows an empty message', () => {
    render(<AlertList items={[]} onOpen={() => {}} />);
    expect(screen.getByText('Bildirim yok.')).toBeInTheDocument();
  });
  it('marks unread items and opens on tap', async () => {
    const onOpen = vi.fn();
    render(<AlertList items={[a, { ...a, id: 2, text: 'Eski', read: true }]} onOpen={onOpen} />);
    expect(screen.getByText('Cevap geldi')).toHaveClass('unread');
    expect(screen.getByText('Eski')).not.toHaveClass('unread');
    await userEvent.click(screen.getByRole('button', { name: /Cevap geldi/ }));
    expect(onOpen).toHaveBeenCalledWith(a);
  });
});
