import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreparationCard } from './PreparationCard';

it('PreparationCard shows the language, steps and retries a failed step', async () => {
  const onRetry = vi.fn();
  render(
    <PreparationCard
      onRetry={onRetry}
      preparation={{ language: 'ar', language_name: 'العربية', steps: [{ key: 'translate', label: 'Çeviri', status: 'done' }, { key: 'dub', label: 'Dublaj', status: 'failed' }] }}
    />,
  );
  expect(screen.getByText('Bu video العربية hazırlanıyor')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }));
  expect(onRetry).toHaveBeenCalledWith('dub');
});
