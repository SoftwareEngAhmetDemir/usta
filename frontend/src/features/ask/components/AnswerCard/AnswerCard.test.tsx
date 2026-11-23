import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { askAnswered } from '../../../../test/fixtures';
import { mockApi } from '../../../../test/utils';
import { AnswerCard } from './AnswerCard';

const show = () => {
  if (askAnswered.status !== 'answered') throw new Error('fixture');
  render(<MemoryRouter><AnswerCard answer={askAnswered.answer} sources={askAnswered.sources} askId={askAnswered.ask_id} /></MemoryRouter>);
};

it('AnswerCard shows the answer with one card per source', () => {
  mockApi({});
  show();
  expect(screen.getByRole('region', { name: 'Cevap' })).toHaveTextContent("1,5 mm'yi geçtiğinde");
  expect(screen.getAllByRole('link')).toHaveLength(2);
  expect(screen.getByText('Ustanın önceki cevabı')).toBeInTheDocument();
});

it('AnswerCard sends 👍 / 👎 feedback once', async () => {
  const { calls } = mockApi({ 'POST /ask/301/feedback': null });
  show();
  await userEvent.click(screen.getByRole('button', { name: 'Hayır' }));
  expect(await screen.findByText('Teşekkürler, geri bildiriminiz kaydedildi.')).toBeInTheDocument();
  expect(calls.find((c) => c.path === '/ask/301/feedback')?.body).toEqual({ feedback: 'not_helpful' });
  expect(screen.queryByRole('button', { name: 'Evet' })).not.toBeInTheDocument();
});
