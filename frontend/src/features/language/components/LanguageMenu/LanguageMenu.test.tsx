import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { languages } from '../../../../test/fixtures';
import { LanguageMenu } from './LanguageMenu';

it('LanguageMenu shows the current language and lets you search by the Turkish name', async () => {
  const onChoose = vi.fn();
  render(<LanguageMenu languages={languages} current="tr" onChoose={onChoose} />);
  const button = screen.getByRole('button', { name: 'Site dili' });
  expect(button).toHaveTextContent('TR');
  await userEvent.click(button);
  await userEvent.type(screen.getByRole('combobox', { name: 'Site dili: ara' }), 'alman');
  await userEvent.click(screen.getByRole('option', { name: /Deutsch/ }));
  expect(onChoose).toHaveBeenCalledWith('de');
});

it('LanguageMenu is hidden until the languages have loaded', () => {
  const { container } = render(<LanguageMenu languages={[]} current="tr" onChoose={vi.fn()} />);
  expect(container).toBeEmptyDOMElement();
});
