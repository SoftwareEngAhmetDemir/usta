import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { inboxQuestion } from '../../../../test/fixtures';
import { InboxList } from './InboxList';

describe('InboxList', () => {
  it('links each open question to the reply screen', () => {
    render(<MemoryRouter><InboxList items={[inboxQuestion]} /></MemoryRouter>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/usta/questions/51');
    expect(link).toHaveTextContent('Yusuf · dili: العربية');
  });
  it('shows an empty message', () => {
    render(<MemoryRouter><InboxList items={[]} /></MemoryRouter>);
    expect(screen.getByText('Açık soru yok.')).toBeInTheDocument();
  });
});
