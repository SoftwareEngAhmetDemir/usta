import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { adminMachines, adminUsers, me } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { AdminMachinesPage, StickersPage, UsersPage } from '.';

describe('patron panel', () => {
  it('lists machines and searches by name on the backend (KAN-32)', async () => {
    const { calls } = mockApi({
      'GET /auth/me': me('patron'),
      'GET /admin/machines?q=': adminMachines,
      'GET /admin/machines?q=fork': { ...adminMachines, machines: adminMachines.machines.slice(1) },
    });
    renderAuthed(<AdminMachinesPage />, '/panel');
    expect(await screen.findByText('Plazma Kesim Makinesi')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Makine ara'), 'fork');
    await waitFor(() => expect(screen.queryByText('Plazma Kesim Makinesi')).not.toBeInTheDocument());
    expect(calls.some((c) => c.path === '/admin/machines?q=fork')).toBe(true);
  });

  it('adds an outside video and refreshes the list (KAN-34)', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me('patron'), 'GET /admin/machines?q=': adminMachines, 'POST /machines/1/external-videos': { id: 3 } });
    renderAuthed(<AdminMachinesPage />, '/panel?machine=1');
    await userEvent.type(await screen.findByLabelText('Bağlantı (YouTube vb.)'), 'https://youtu.be/x');
    await userEvent.type(screen.getAllByLabelText('Başlık')[1]!, 'Üretici');
    await userEvent.click(screen.getByRole('button', { name: 'Ekle' }));
    expect(await screen.findByText('Eklendi')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ title: 'Üretici', url: 'https://youtu.be/x', source: 'manufacturer' });
    expect(calls.filter((c) => c.path === '/admin/machines?q=')).toHaveLength(2);
  });

  it('shows QR stickers and makes a PDF of the ticked machines (KAN-30)', async () => {
    mockApi({ 'GET /auth/me': me('patron'), 'GET /admin/machines?q=': adminMachines });
    renderAuthed(<StickersPage />);
    expect(await screen.findByAltText('Plazma Kesim Makinesi QR kodu')).toBeInTheDocument();
    const pdf = screen.getByRole('link', { name: 'PDF indir (2)' });
    expect(pdf).toHaveAttribute('href', '/api/admin/qr-stickers.pdf');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Forklift 3 yazdır' }));
    expect(screen.getByRole('link', { name: 'PDF indir (1)' })).toHaveAttribute('href', '/api/admin/qr-stickers.pdf?ids=1');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Plazma Kesim Makinesi yazdır' }));
    expect(screen.queryByRole('link', { name: /PDF indir/ })).not.toBeInTheDocument();
    expect(screen.getByText('Yazdırmak için en az bir makine seçin.')).toBeInTheDocument();
  });

  it('lists users and roles (KAN-25, KAN-26)', async () => {
    mockApi({ 'GET /auth/me': me('patron'), 'GET /admin/users': adminUsers });
    renderAuthed(<UsersPage />);
    expect(await screen.findByText('Emre K.')).toBeInTheDocument();
  });
});
