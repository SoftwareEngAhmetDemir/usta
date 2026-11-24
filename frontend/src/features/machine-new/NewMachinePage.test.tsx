import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider, RequireAuth } from '../auth';
import { OtherPage } from '../../test/OtherPage';
import userEvent from '@testing-library/user-event';
import { me } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { NewMachinePage } from './NewMachinePage';

const fill = async (label: RegExp, text: string) => userEvent.type(await screen.findByLabelText(label), text);

describe('NewMachinePage', () => {
  it('adds a machine and opens its page', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me('usta'), 'POST /machines': { id: 12 } });
    renderAuthed(<NewMachinePage />, '/machines/new', '/machines/new');
    await fill(/Makine kodu/, 'CNC-7');
    await fill(/Makine adı/, 'CNC Torna');
    await fill(/Konum/, 'Atölye B');
    await userEvent.click(screen.getByRole('button', { name: 'Makineyi ekle' }));
    expect(await screen.findByText('other page /m/12')).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ code: 'CNC-7', name: 'CNC Torna', type: '', model: '', serial: '', location: 'Atölye B' });
  });

  it('asks for code and name before sending', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me('usta') });
    renderAuthed(<NewMachinePage />, '/machines/new', '/machines/new');
    await fill(/Makine kodu/, 'CNC-7');
    await userEvent.click(screen.getByRole('button', { name: 'Makineyi ekle' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Makine kodu ve adı gerekli.');
    expect(calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('opened from the scan page with a new QR: the code comes from the QR, locked, and the QR stays with the machine', async () => {
    const bill = "{ tarih='2026-11-22' }";
    const { calls } = mockApi({ 'GET /auth/me': me('usta'), 'POST /machines/code-for-qr': { code: 'QR-7F3A9C2B' }, 'POST /machines': { id: 13 } });
    renderWithState({ qr: bill });
    const notice = (await screen.findByText('Taranan QR bu makineye bağlanacak')).closest('[role=status]');
    expect(notice).toHaveTextContent(bill);
    const code = screen.getByLabelText(/Makine kodu/);
    await waitFor(() => expect(code).toHaveValue('QR-7F3A9C2B'));
    expect(code).toBeDisabled();
    expect(code).toHaveAccessibleDescription('QR’dan alındı, değiştirilemez.');
    expect(calls.find((c) => c.path === '/machines/code-for-qr')?.body).toEqual({ qr_text: bill }); // in the body, not the URL
    await fill(/Makine adı/, 'Kumlama');
    await userEvent.click(screen.getByRole('button', { name: 'Makineyi ekle' }));
    expect(await screen.findByText('other page /m/13')).toBeInTheDocument();
    expect(calls.find((c) => c.path === '/machines')?.body).toMatchObject({ code: 'QR-7F3A9C2B', name: 'Kumlama', qr_text: bill });
  });

  it('still saves with a QR when its code could not be shown (the backend sets it from the QR)', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me('usta'), 'POST /machines': { id: 15 } }); // code-for-qr → 404
    renderWithState({ qr: 'TAG-77' });
    expect(await screen.findByLabelText(/Makine kodu/)).toBeDisabled();
    await fill(/Makine adı/, 'Kumlama');
    await userEvent.click(screen.getByRole('button', { name: 'Makineyi ekle' }));
    expect(await screen.findByText('other page /m/15')).toBeInTheDocument();
    expect(calls.find((c) => c.path === '/machines')?.body).toMatchObject({ qr_text: 'TAG-77' });
  });

  it('opened with a typed code: the code is filled in, no QR is sent', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me('usta'), 'POST /machines': { id: 14 } });
    renderWithState({ code: 'PK-200' });
    expect(await screen.findByLabelText(/Makine kodu/)).toHaveValue('PK-200');
    expect(screen.queryByText('Taranan QR bu makineye bağlanacak')).not.toBeInTheDocument();
    await fill(/Makine adı/, 'Pres');
    await userEvent.click(screen.getByRole('button', { name: 'Makineyi ekle' }));
    await screen.findByText('other page /m/14');
    expect(calls.find((c) => c.method === 'POST')?.body).not.toHaveProperty('qr_text');
  });
});

/** The page as the scan page opens it: router state carries the QR or code. */
function renderWithState(state: object) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/machines/new', state }]}>
      <AuthProvider>
        <Routes>
          <Route path="/machines/new" element={<RequireAuth><NewMachinePage /></RequireAuth>} />
          <Route path="*" element={<OtherPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}
