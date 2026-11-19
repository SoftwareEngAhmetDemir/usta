import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

it('ProgressBar clamps and shows a percentage', () => {
  render(<ProgressBar fraction={1.4} label="Yükleniyor" />);
  expect(screen.getByRole('progressbar', { name: 'Yükleniyor' })).toHaveValue(100);
  expect(screen.getByText('Yükleniyor · %100')).toBeInTheDocument();
});
