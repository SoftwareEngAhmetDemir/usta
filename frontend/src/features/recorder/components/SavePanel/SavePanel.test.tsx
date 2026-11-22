import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavePanel } from './SavePanel';

describe('SavePanel', () => {
  it('asks for a title, then saves', async () => {
    const onSave = vi.fn();
    render(<SavePanel saving={false} onRetake={() => {}} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Kısa bir başlık yazın.');
    await userEvent.type(screen.getByLabelText('Başlık'), 'Torç kontrolü');
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    expect(onSave).toHaveBeenCalledWith('Torç kontrolü');
  });
  it('retakes', async () => {
    const onRetake = vi.fn();
    render(<SavePanel saving={false} onRetake={onRetake} onSave={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Yeniden çek' }));
    expect(onRetake).toHaveBeenCalled();
  });
});
