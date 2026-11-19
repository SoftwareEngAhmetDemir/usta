import { render, screen } from '@testing-library/react';
import { adminMachines } from '../../../../test/fixtures';
import { StatsTiles } from './StatsTiles';

it('StatsTiles shows the backend totals', () => {
  render(<StatsTiles stats={adminMachines.stats} />);
  expect(screen.getByText('bakım kaydı').parentElement).toHaveTextContent('3bakım kaydı');
});
