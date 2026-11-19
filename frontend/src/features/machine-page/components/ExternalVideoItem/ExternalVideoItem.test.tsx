import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExternalVideoItem } from './ExternalVideoItem';

const v = { id: 1, title: 'Üretici: Sarf malzeme', url: 'https://youtu.be/x', embed_url: 'https://www.youtube-nocookie.com/embed/x', source: 'manufacturer' as const };

describe('ExternalVideoItem', () => {
  it('plays embedded on tap', async () => {
    render(<ExternalVideoItem video={v} />);
    expect(screen.getByText('Dış kaynak · Üretici')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Sarf malzeme/ }));
    expect(screen.getByTitle('Üretici: Sarf malzeme')).toHaveAttribute('src', v.embed_url);
  });
  it('opens the link when embedding is not allowed', () => {
    render(<ExternalVideoItem video={{ ...v, embed_url: null }} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://youtu.be/x');
  });
});
