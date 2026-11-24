import { screen, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { me } from '../../test/fixtures';
import { fakeQr } from '../../test/fakeQrScanner';
import { mockApi, renderAuthed, stubQrCamera } from '../../test/utils';
import { ApiError } from '../../api';
import { ScanPage } from './ScanPage';
import { SAME_QR_PAUSE_MS } from './hooks/useQrScanner';

vi.mock('qr-scanner', () => import('../../test/fakeQrScanner'));
vi.mock('./zxing', () => ({ installZxing: async () => undefined }));

describe('ScanPage', () => {
  it('opens the machine page from a typed code', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/lookup?code=PK-105': { id: 1 } });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    await userEvent.type(await screen.findByLabelText(/makine kodunu/), 'pk-105');
    await userEvent.click(screen.getByRole('button', { name: 'Aç' }));
    expect(await screen.findByText('other page /m/1')).toBeInTheDocument();
  });
  it('shows a "not found" dialog for an unknown typed code and closes it', async () => {
    mockApi({ 'GET /auth/me': me('worker') });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    await userEvent.type(await screen.findByLabelText(/makine kodunu/), 'XX');
    await userEvent.click(screen.getByRole('button', { name: 'Aç' }));
    const dialog = await screen.findByRole('dialog', { name: 'Makine bulunamadı' });
    expect(dialog).toHaveTextContent('XX');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tekrar tara' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('shows the dialog once for a scanned QR that is no machine', async () => {
    stubQrCamera('https://elsewhere.example/menu');
    const { calls } = mockApi({ 'GET /auth/me': me('worker') });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    expect(await screen.findByRole('dialog', { name: 'Makine bulunamadı' })).toHaveTextContent('https://elsewhere.example/menu');
    await new Promise((r) => setTimeout(r, 700)); // the camera still sees the same QR
    expect(calls.filter((c) => c.path.startsWith('/machines/lookup'))).toHaveLength(1);
  });
  it('after "Tekrar tara" reads the next QR (a bill first, then the machine sticker)', async () => {
    stubQrCamera('{ tarih=\'2026-11-22\', senaryo=\'EARSIVFATURA\' }');
    mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/lookup?code=https%3A%2F%2Fusta.example%2Fm%2F7': { id: 7 } });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Tekrar tara' }));
    fakeQr.live = 'https://usta.example/m/7'; // the user turns to the sticker
    expect(await screen.findByText('other page /m/7')).toBeInTheDocument();
  });
  it('answers the same QR again a moment after "Tekrar tara" instead of staying silent', async () => {
    stubQrCamera('https://elsewhere.example/menu');
    const { calls } = mockApi({ 'GET /auth/me': me('worker') });
    const lookups = () => calls.filter((c) => c.path.startsWith('/machines/lookup')).length;
    renderAuthed(<ScanPage />, '/scan', '/scan');
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Tekrar tara' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await new Promise((r) => setTimeout(r, SAME_QR_PAUSE_MS / 2)); // still in view: time to aim elsewhere
    expect(lookups()).toBe(1);
    expect(await screen.findByRole('dialog', {}, { timeout: SAME_QR_PAUSE_MS + 1000 })).toBeInTheDocument();
    expect(lookups()).toBe(2);
  });
  it('offers an usta to add a machine with an unknown QR, and hands the QR to the form', async () => {
    stubQrCamera('TAG-77');
    mockApi({ 'GET /auth/me': me('usta') });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    expect(await screen.findByRole('dialog', { name: 'Yeni QR' })).toHaveTextContent('TAG-77');
    await userEvent.click(screen.getByRole('button', { name: 'Evet, makine ekle' }));
    expect(await screen.findByText('other page /machines/new')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'route state' })).toHaveTextContent('{"qr":"TAG-77"}');
  });
  it('offers an usta to add a machine with an unknown typed code, as its code', async () => {
    mockApi({ 'GET /auth/me': me('usta') });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    await userEvent.type(await screen.findByLabelText(/makine kodunu/), 'pk-200');
    await userEvent.click(screen.getByRole('button', { name: 'Aç' }));
    await userEvent.click(within(await screen.findByRole('dialog', { name: 'Yeni makine kodu' })).getByRole('button', { name: 'Evet, makine ekle' }));
    expect(screen.getByRole('status', { name: 'route state' })).toHaveTextContent('{"code":"PK-200"}');
  });
  it('never offers adding to a worker, nor for a QR too long to keep', async () => {
    stubQrCamera('TAG-77');
    mockApi({ 'GET /auth/me': me('worker') });
    const { unmount } = renderAuthed(<ScanPage />, '/scan', '/scan');
    expect(await screen.findByRole('dialog', { name: 'Makine bulunamadı' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Evet, makine ekle' })).not.toBeInTheDocument();
    unmount();
    stubQrCamera('x'.repeat(600));
    mockApi({ 'GET /auth/me': me('usta'), [`GET /machines/lookup?code=${'x'.repeat(600)}`]: () => { throw new ApiError(422, null); } });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    expect(await screen.findByRole('dialog', { name: 'Makine bulunamadı' })).toBeInTheDocument();
  });
  it('keeps other errors (network down) inline', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/lookup?code=PK-1': () => { throw new TypeError('Failed to fetch'); } });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    await userEvent.type(await screen.findByLabelText(/makine kodunu/), 'PK-1');
    await userEvent.click(screen.getByRole('button', { name: 'Aç' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('opens the machine page from a scanned QR', async () => {
    stubQrCamera('https://usta.example/m/7');
    const { calls } = mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/lookup?code=https%3A%2F%2Fusta.example%2Fm%2F7': { id: 7 } });
    renderAuthed(<ScanPage />, '/scan', '/scan');
    expect(await screen.findByText('other page /m/7')).toBeInTheDocument();
    expect(calls.filter((c) => c.path.startsWith('/machines/lookup'))).toHaveLength(1);
  });
});
