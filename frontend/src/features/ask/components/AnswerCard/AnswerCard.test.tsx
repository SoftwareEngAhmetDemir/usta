import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { askAnswered } from '../../../../test/fixtures';
import { AnswerCard } from './AnswerCard';

it('AnswerCard shows the answer with one card per source', () => {
  if (askAnswered.status !== 'answered') throw new Error('fixture');
  render(<MemoryRouter><AnswerCard answer={askAnswered.answer} sources={askAnswered.sources} /></MemoryRouter>);
  expect(screen.getByRole('region', { name: 'Cevap' })).toHaveTextContent("1,5 mm'yi geçtiğinde");
  expect(screen.getAllByRole('link')).toHaveLength(2);
  expect(screen.getByText('Ustanın önceki cevabı')).toBeInTheDocument();
});
