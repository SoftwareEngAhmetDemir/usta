import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepList } from './StepList';

it('StepList shows each step status and retries a failed one', async () => {
  const onRetry = vi.fn();
  render(
    <StepList
      onRetry={onRetry}
      steps={[
        { key: 'translate', label: 'Çeviri', status: 'done' },
        { key: 'dub', label: 'Dublaj', status: 'failed' },
        { key: 'mix', label: 'Miksaj', status: 'waiting' },
      ]}
    />,
  );
  expect(screen.getByText('(tamam)')).toBeInTheDocument();
  expect(screen.getByText('(bekliyor)')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }));
  expect(onRetry).toHaveBeenCalledWith('dub');
});
