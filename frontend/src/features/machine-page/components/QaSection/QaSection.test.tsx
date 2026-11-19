import { render, screen } from '@testing-library/react';
import { QaSection } from './QaSection';

it('QaSection shows an empty message', () => {
  render(<QaSection questions={[]} />);
  expect(screen.getByRole('heading', { name: /Sorular & cevaplar/ })).toHaveTextContent('0');
  expect(screen.getByText('Henüz soru yok.')).toBeInTheDocument();
});
