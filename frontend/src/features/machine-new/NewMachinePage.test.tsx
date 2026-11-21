import { screen } from '@testing-library/react';
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
});
