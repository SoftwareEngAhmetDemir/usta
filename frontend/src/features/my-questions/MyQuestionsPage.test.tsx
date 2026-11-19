import { screen } from '@testing-library/react';
import { me, myQuestions } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { MyQuestionsPage } from './MyQuestionsPage';

describe('MyQuestionsPage', () => {
  it('lists the worker questions with status', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /me/questions': myQuestions });
    renderAuthed(<MyQuestionsPage />);
    expect(await screen.findByText('Açık')).toBeInTheDocument();
    expect(screen.getByText('Cevaplandı')).toBeInTheDocument();
  });
  it('shows an empty message', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /me/questions': [] });
    renderAuthed(<MyQuestionsPage />);
    expect(await screen.findByText('Henüz ustaya soru sormadınız.')).toBeInTheDocument();
  });
});
