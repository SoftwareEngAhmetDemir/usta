import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReplyForm } from './ReplyForm';

describe('ReplyForm', () => {
  it('requires an answer', async () => {
    const onSend = vi.fn();
    render(<ReplyForm sending={false} onSend={onSend} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cevabı gönder' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Bir cevap yazın');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends a text answer', async () => {
    const onSend = vi.fn();
    render(<ReplyForm sending={false} onSend={onSend} />);
    await userEvent.type(screen.getByLabelText('Cevabın'), 'Hızı düşür');
    await userEvent.click(screen.getByRole('button', { name: 'Cevabı gönder' }));
    expect(onSend).toHaveBeenCalledWith({ text: 'Hızı düşür', video: null, file: null });
  });

  it('sends a video answer from the camera or gallery', async () => {
    const onSend = vi.fn();
    render(<ReplyForm sending={false} onSend={onSend} />);
    await userEvent.click(screen.getByRole('button', { name: 'Video' }));
    const video = new File(['x'], 'cevap.mp4', { type: 'video/mp4' });
    await userEvent.upload(screen.getByLabelText('Video (çek veya seç)'), video);
    await userEvent.click(screen.getByRole('button', { name: 'Cevabı gönder' }));
    expect(onSend).toHaveBeenCalledWith({ text: '', video, file: null });
  });
});
