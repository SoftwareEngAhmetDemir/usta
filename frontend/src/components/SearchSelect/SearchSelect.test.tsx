import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchSelect } from './SearchSelect';

const options = [
  { value: 'tr', label: 'Türkçe', hint: 'Türkçe' },
  { value: 'de', label: 'Deutsch', hint: 'Almanca', lang: 'de' },
  { value: 'sv', label: 'Svenska', hint: 'İsveççe' },
  { value: 'fa', label: 'فارسی · hazırlanıyor', hint: 'Farsça', disabled: true },
];

function setup() {
  const onChange = vi.fn();
  render(<SearchSelect id="lang" label="Dil" value="tr" options={options} onChange={onChange} />);
  return onChange;
}

describe('SearchSelect', () => {
  it('shows the current choice and opens a searchable list with it selected', async () => {
    setup();
    const button = screen.getByRole('button', { name: 'Dil' });
    expect(button).toHaveTextContent('Türkçe');
    await userEvent.click(button);
    expect(screen.getByRole('combobox', { name: 'Dil: ara' })).toHaveFocus();
    expect(screen.getByRole('option', { name: 'Türkçe' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('narrows the list by the Turkish name without accents and picks with Enter', async () => {
    const onChange = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Dil' }));
    await userEvent.type(screen.getByRole('combobox'), 'isvec');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Svenska İsveççe']);
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('sv');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('button', { name: 'Dil' })).toHaveFocus();
  });

  it('picks by click, ignores disabled options, says when nothing matches and closes with Escape', async () => {
    const onChange = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Dil' }));
    await userEvent.click(screen.getByRole('option', { name: /فارسی/ }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('option', { name: /Deutsch/ }));
    expect(onChange).toHaveBeenCalledWith('de');
    await userEvent.click(screen.getByRole('button', { name: 'Dil' }));
    await userEvent.type(screen.getByRole('combobox'), 'xyz');
    expect(screen.getByText('Sonuç yok')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('moves the highlight with the arrow keys', async () => {
    const onChange = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Dil' }));
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('sv');
  });
});
