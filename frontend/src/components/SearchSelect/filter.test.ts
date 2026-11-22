import { filterOptions, normalize } from './filter';

const options = [
  { value: 'tr', label: 'Türkçe', hint: 'Türkçe' },
  { value: 'de', label: 'Deutsch', hint: 'Almanca' },
  { value: 'sv', label: 'Svenska', hint: 'İsveççe' },
  { value: 'ar', label: 'العربية', hint: 'Arapça' },
];

describe('filterOptions', () => {
  it('folds case, Turkish i and accents', () => {
    expect(normalize('İsveççe ILIK')).toBe('isvecce ilik');
  });

  it('finds by native name, Turkish name or code, without accents', () => {
    expect(filterOptions(options, 'turkce').map((o) => o.value)).toEqual(['tr']);
    expect(filterOptions(options, 'alman').map((o) => o.value)).toEqual(['de']);
    expect(filterOptions(options, 'isvec').map((o) => o.value)).toEqual(['sv']);
    expect(filterOptions(options, 'العر').map((o) => o.value)).toEqual(['ar']);
    expect(filterOptions(options, 'ar').map((o) => o.value)).toEqual(['ar']);
  });

  it('shows everything for an empty query and nothing for no match', () => {
    expect(filterOptions(options, '  ')).toHaveLength(4);
    expect(filterOptions(options, 'xyz')).toEqual([]);
  });
});
