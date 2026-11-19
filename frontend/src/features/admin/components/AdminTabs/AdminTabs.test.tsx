import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AdminTabs } from './AdminTabs';

it('AdminTabs marks the current tab and links SQLAdmin', () => {
  render(<MemoryRouter initialEntries={['/panel/stickers']}><AdminTabs /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'QR etiketleri' })).toHaveClass('active');
  expect(screen.getByRole('link', { name: 'Makineler' })).not.toHaveClass('active');
  expect(screen.getByRole('link', { name: /Kayıtları düzenle/ })).toHaveAttribute('href', '/admin');
});
