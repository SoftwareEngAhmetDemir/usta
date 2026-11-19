import { render, screen } from '@testing-library/react';
import { Field } from './Field';

it('Field links the label to the control and shows an error', () => {
  render(<Field label="Başlık" htmlFor="t" error="Başlık gerekli"><input id="t" /></Field>);
  expect(screen.getByLabelText('Başlık')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Başlık gerekli');
});
