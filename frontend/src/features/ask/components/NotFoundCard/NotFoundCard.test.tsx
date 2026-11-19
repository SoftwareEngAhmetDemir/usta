import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotFoundCard } from './NotFoundCard';

const ustas = [{ id: 7, name: 'Mehmet Usta' }];

describe('NotFoundCard', () => {
  it('offers "Ustaya sor" with the question filled in', async () => {
    const onSend = vi.fn();
    render(<NotFoundCard question="Çapak oluşuyor" ustas={ustas} sent={null} sending={false} onSend={onSend} />);
    expect(screen.getByLabelText('Ustaya gidecek soru')).toHaveValue('Çapak oluşuyor');
    await userEvent.click(screen.getByRole('button', { name: /Ustaya sor \(Mehmet Usta\)/ }));
    expect(onSend).toHaveBeenCalledWith('Çapak oluşuyor');
  });
  it('confirms who received it', () => {
    render(<NotFoundCard question="q" ustas={ustas} sent={{ id: 1, status: 'open', recipients: ustas }} sending={false} onSend={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Soru Mehmet Usta kişisine iletildi.');
  });
});
