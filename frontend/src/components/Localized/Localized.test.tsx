import { render, screen } from '@testing-library/react';
import { Localized } from './Localized';

it('Localized sets lang and dir', () => {
  render(<Localized as="p" value={{ text: 'مرحبا', lang: 'ar', dir: 'rtl' }} />);
  const el = screen.getByText('مرحبا');
  expect(el.tagName).toBe('P');
  expect(el).toHaveAttribute('dir', 'rtl');
  expect(el).toHaveAttribute('lang', 'ar');
});
