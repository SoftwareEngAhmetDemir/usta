import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { I18nProvider, useT } from '../../../i18n';
import { holdFetch, mockApi } from '../../../test/utils';
import { LanguageGate } from './LanguageGate';

function Page() {
  const t = useT();
  return <h1>{t('Makine')}</h1>;
}

beforeEach(() => localStorage.clear());

it('LanguageGate shows a skeleton instead of the page until its texts are translated', async () => {
  const request = holdFetch();
  render(<I18nProvider language="ar"><LanguageGate languageName="العربية"><Page /></LanguageGate></I18nProvider>);
  expect(await screen.findByRole('status')).toHaveTextContent('العربية…');
  expect(screen.queryByRole('heading')).not.toBeInTheDocument(); // rendered (so it asks for its texts) but hidden
  request.answer({ language: 'ar', dir: 'rtl', texts: { Makine: 'آلة' } });
  expect(await screen.findByRole('heading', { name: 'آلة' })).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('LanguageGate shows the page straight away when nothing needs translating', () => {
  mockApi({});
  render(<I18nProvider language="tr"><LanguageGate languageName="Türkçe"><Page /></LanguageGate></I18nProvider>);
  expect(screen.getByRole('heading', { name: 'Makine' })).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
