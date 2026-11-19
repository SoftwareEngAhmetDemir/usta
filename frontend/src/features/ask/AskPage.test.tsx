import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { askAnswered, askNotFound, machinePage, me, questionSent } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { AskPage } from './AskPage';

const show = () => renderAuthed(<AskPage />, '/m/1/ask', '/m/:machineId/ask');

async function ask(q: string) {
  await userEvent.type(await screen.findByLabelText('Sorunuz'), q);
  await userEvent.click(screen.getByRole('button', { name: 'Sor' }));
}

describe('AskPage (KAN-61)', () => {
  it('shows the answer with source cards', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/1': machinePage, 'POST /machines/1/ask': askAnswered });
    show();
    await ask('Elektrot ne zaman değiştirilir?');
    expect(await screen.findByRole('region', { name: 'Cevap' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /VİDEO · 1:48/ })).toHaveAttribute('href', '/videos/1?t=108');
    expect(calls.find((c) => c.path === '/machines/1/ask')?.body).toEqual({ question: 'Elektrot ne zaman değiştirilir?' });
  });

  it('not found → Ustaya sor sends the question to the ustas (KAN-62)', async () => {
    const { calls } = mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/1': machinePage, 'POST /machines/1/ask': askNotFound, 'POST /machines/1/questions': questionSent });
    show();
    await ask('Çapak oluşuyor');
    await userEvent.click(await screen.findByRole('button', { name: /Ustaya sor/ }));
    expect(await screen.findByText(/Mehmet Usta, Hasan Usta kişisine iletildi/)).toBeInTheDocument();
    expect(calls.find((c) => c.path === '/machines/1/questions')?.body).toEqual({ question: 'Çapak oluşuyor' });
    expect(screen.getByRole('link', { name: 'Sorularım →' })).toBeInTheDocument();
  });

  it('shows an error when the search fails', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/1': machinePage });
    show();
    await ask('x');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
