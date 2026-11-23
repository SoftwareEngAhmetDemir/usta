import { render, screen } from '@testing-library/react';
import { Pill } from './Pill';

it('Pill renders text with its tone class', () => {
  render(<Pill tone="ok">Yetkili</Pill>);
  expect(screen.getByText('Yetkili')).toHaveAttribute('data-tone', 'ok');
});
