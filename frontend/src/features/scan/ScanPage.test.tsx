import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { me } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { ScanPage } from './ScanPage';

describe('ScanPage', () => {
  it('opens the machine page from a typed code', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/lookup?code=PK-105': { id: 1 } });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    await userEvent.type(await screen.findByLabelText(/makine kodunu/), 'pk-105');
    await userEvent.click(screen.getByRole('button', { name: 'Aç' }));
    expect(await screen.findByText('other page /m/1')).toBeInTheDocument();
  });
  it('shows not found for an unknown code', async () => {
    mockApi({ 'GET /auth/me': me('worker') });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    await userEvent.type(await screen.findByLabelText(/makine kodunu/), 'XX');
    await userEvent.click(screen.getByRole('button', { name: 'Aç' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Bulunamadı.');
  });
});
