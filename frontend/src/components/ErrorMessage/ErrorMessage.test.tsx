import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../api';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders nothing without an error', () => {
    const { container } = render(<ErrorMessage error={null} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('shows the Turkish message and retries', async () => {
    const onRetry = vi.fn();
    render(<ErrorMessage error={new ApiError(404, null)} onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Bulunamadı.');
    await userEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
