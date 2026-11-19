import { render, screen } from '@testing-library/react';
import { SummaryCard } from './SummaryCard';

describe('SummaryCard', () => {
  it('shows the points right-to-left for Arabic', () => {
    render(<SummaryCard status="ready" summary={{ points: ['نقطة'], lang: 'ar', dir: 'rtl', language_name: 'العربية' }} />);
    expect(screen.getByRole('region', { name: 'AI özet' })).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('listitem')).toHaveTextContent('نقطة');
  });
  it('shows preparing and none states', () => {
    const { rerender } = render(<SummaryCard status="preparing" summary={null} />);
    expect(screen.getByText(/hazırlanıyor/)).toBeInTheDocument();
    rerender(<SummaryCard status="none" summary={null} />);
    expect(screen.getByText('Bu doküman için özet yok.')).toBeInTheDocument();
  });
});
