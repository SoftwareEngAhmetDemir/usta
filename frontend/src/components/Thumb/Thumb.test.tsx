import { render } from '@testing-library/react';
import { Thumb } from './Thumb';

it('Thumb is decorative (hidden from screen readers) and holds its picture', () => {
  const { container } = render(<Thumb kind="video" wide><img src="/k.jpg" alt="" /></Thumb>);
  const thumb = container.firstElementChild;
  expect(thumb).toHaveAttribute('aria-hidden', 'true');
  expect(thumb?.querySelector('img')).toHaveAttribute('src', '/k.jpg');
});
