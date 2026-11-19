import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { QaEntry } from '../../api';
import { QaCard } from './QaCard';

const entry: QaEntry = {
  id: 1,
  machine_id: 1,
  machine_name: 'Plazma Kesim',
  question: { text: 'ماذا أفحص؟', lang: 'ar', dir: 'rtl' },
  answer: { text: 'افحص الضغط', lang: 'ar', dir: 'rtl' },
  original_question: { text: 'Ne kontrol etmeliyim?', lang: 'tr', dir: 'ltr' },
  original_answer: null,
  answer_video_id: 4,
  answer_file_url: null,
  usta: { id: 7, name: 'Mehmet Usta' },
  answered_at: '2026-11-08T10:00:00',
};

describe('QaCard', () => {
  it('shows question and answer in the viewer language with links', () => {
    render(<MemoryRouter><QaCard entry={entry} showMachine /></MemoryRouter>);
    expect(screen.getByText('افحص الضغط')).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('link', { name: '▶ Cevap videosu' })).toHaveAttribute('href', '/videos/4');
    expect(screen.getByRole('link', { name: 'Mehmet Usta' })).toHaveAttribute('href', '/ustas/7');
    expect(screen.getByRole('link', { name: 'Plazma Kesim' })).toHaveAttribute('href', '/m/1');
    expect(screen.getByText('Ne kontrol etmeliyim?')).toBeInTheDocument();
  });
  it('hides the original block when nothing was translated', () => {
    render(<MemoryRouter><QaCard entry={{ ...entry, original_question: null }} /></MemoryRouter>);
    expect(screen.queryByText('Orijinalini göster')).not.toBeInTheDocument();
  });
});
