import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { me } from '../../test/fixtures';
import { mockApi, renderAuthed, stubQrCamera } from '../../test/utils';
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
  it('opens the machine page from a scanned QR', async () => {
    stubQrCamera('https://usta.example/m/7');
    const { calls } = mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/lookup?code=https%3A%2F%2Fusta.example%2Fm%2F7': { id: 7 } });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    expect(await screen.findByText('other page /m/7')).toBeInTheDocument();
    expect(calls.filter((c) => c.path.startsWith('/machines/lookup'))).toHaveLength(1);
  });
});
