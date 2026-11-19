import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { myQuestions } from '../../../../test/fixtures';
import { MyQuestionItem } from './MyQuestionItem';

describe('MyQuestionItem', () => {
  it('shows an open question', () => {
    render(<MemoryRouter><MyQuestionItem item={myQuestions[0]!} /></MemoryRouter>);
    expect(screen.getByText('Açık')).toBeInTheDocument();
  });
  it('shows the answer and who answered', () => {
    render(<MemoryRouter><MyQuestionItem item={myQuestions[1]!} /></MemoryRouter>);
    expect(screen.getByText('Cevaplandı')).toBeInTheDocument();
    expect(screen.getByText(/toprak pensesini/)).toBeInTheDocument();
    expect(screen.getByText(/Mehmet Usta/)).toBeInTheDocument();
  });
});
