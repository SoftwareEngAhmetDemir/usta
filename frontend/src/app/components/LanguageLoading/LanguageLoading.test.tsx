import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { I18nProvider, useT } from '../../../i18n';
import { holdFetch, mockApi } from '../../../test/utils';
import { LanguageLoading } from './LanguageLoading';

function Page() {
  const t = useT();
  return <p>{t('Merhaba')}</p>;
}

beforeEach(() => localStorage.clear());

it('LanguageLoading shows the language name with a spinner until the UI texts arrive', async () => {
  const request = holdFetch();
  render(<I18nProvider language="ar"><LanguageLoading languageName="العربية" /><Page /></I18nProvider>);
  expect(await screen.findByRole('status')).toHaveTextContent('العربية…');
  request.answer({ language: 'ar', dir: 'rtl', texts: { Merhaba: 'مرحبا' } });
  expect(await screen.findByText('مرحبا')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('LanguageLoading shows nothing for Turkish (nothing to load)', () => {
  mockApi({});
  render(<I18nProvider language="tr"><LanguageLoading languageName="Türkçe" /><Page /></I18nProvider>);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
