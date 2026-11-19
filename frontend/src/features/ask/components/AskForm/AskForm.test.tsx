import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AskForm } from './AskForm';

describe('AskForm', () => {
  it('sends the trimmed question and clears the box', async () => {
    const onAsk = vi.fn();
    render(<AskForm onAsk={onAsk} busy={false} />);
    const box = screen.getByLabelText('Sorunuz');
    expect(screen.getByRole('button', { name: 'Sor' })).toBeDisabled();
    await userEvent.type(box, '  Elektrot ne zaman değişir?  ');
    await userEvent.click(screen.getByRole('button', { name: 'Sor' }));
    expect(onAsk).toHaveBeenCalledWith('Elektrot ne zaman değişir?');
    expect(box).toHaveValue('');
  });
});
