import { render, screen } from '@testing-library/react';
import { Notice } from './Notice';

it('Notice announces problems as alerts and other states as status', () => {
  const { unmount } = render(<Notice tone="bad">Yetkiniz yok.</Notice>);
  expect(screen.getByRole('alert')).toHaveTextContent('Yetkiniz yok.');
  unmount();
  render(<Notice tone="waiting" title="Özet hazırlanıyor…" />);
  expect(screen.getByRole('status')).toHaveTextContent('Özet hazırlanıyor…');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
