import { render, screen } from '@testing-library/react';
import type { MaintenanceRecord } from '../../api';
import { MaintenanceTimeline } from './MaintenanceTimeline';

const rec = (id: number, authorized: boolean): MaintenanceRecord => ({
  id,
  machine_id: 2,
  machine_name: 'Forklift 3',
  description: `İş ${id}`,
  created_at: '2026-11-14T09:40:00',
  done_by: { id: 5, name: 'Emre K.', authorized, authorization_document_url: null },
  opened_by: { id: 3, name: 'Ali Usta' },
  attachments: id === 1 ? [{ id: 9, kind: 'photo', url: '/uploads/p.jpg' }, { id: 10, kind: 'video', url: '/uploads/v.mp4' }] : [],
});

describe('MaintenanceTimeline', () => {
  it('shows who, when, what, attachments and the authorized badge in API order', () => {
    render(<MaintenanceTimeline records={[rec(1, true), rec(2, false)]} highlightId={1} showMachine />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('İş 1');
    expect(items[0]).toHaveTextContent('Forklift 3 · 14.11.2026 09:40');
    expect(items[0]).toHaveTextContent('Yapan: Emre K. Yetkili · Açan: Ali Usta');
    expect(items[0]).toHaveAttribute('aria-current', 'true'); // shown highlighted
    expect(items[1]).not.toHaveAttribute('aria-current');
    expect(items[1]).not.toHaveTextContent('Yetkili');
    expect(screen.getByAltText('Bakım fotoğrafı')).toHaveAttribute('src', '/uploads/p.jpg');
    expect(screen.getByLabelText('Bakım videosu')).toHaveAttribute('src', '/uploads/v.mp4');
  });
});
