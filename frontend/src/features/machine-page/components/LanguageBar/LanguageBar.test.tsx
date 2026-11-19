import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageBar } from './LanguageBar';

const langs = [
  { code: 'tr', name: 'Türkçe', dir: 'ltr' as const },
  { code: 'ar', name: 'العربية', dir: 'rtl' as const },
];

it('LanguageBar marks the current language and reports a choice', async () => {
  const onChoose = vi.fn();
  render(<LanguageBar languages={langs} current="tr" onChoose={onChoose} />);
  expect(screen.getByRole('button', { name: 'Türkçe' })).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(screen.getByRole('button', { name: 'العربية' }));
  expect(onChoose).toHaveBeenCalledWith('ar');
});
