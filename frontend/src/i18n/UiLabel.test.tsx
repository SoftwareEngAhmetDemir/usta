import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { holdFetch, mockApi } from '../test/utils';
import { I18nProvider } from './I18nProvider';
import { UiLabel } from './UiLabel';
import { useT } from './useT';

function NewPage() {
  const t = useT();
  return <p>{t('Yeni sayfa metni')}</p>;
}

beforeEach(() => localStorage.clear());

it('UiLabel keeps an already translated label while another page is loading its texts', async () => {
  localStorage.setItem('ui-texts:ar', JSON.stringify({ dir: 'rtl', texts: { Tara: 'مسح' } }));
  holdFetch(); // the new page's texts never arrive in this test
  render(<I18nProvider language="ar"><nav><UiLabel text="Tara" /></nav><NewPage /></I18nProvider>);
  await new Promise((r) => setTimeout(r, 60)); // the page's batch is out
  expect(screen.getByRole('navigation')).toHaveTextContent('مسح');
  expect(document.querySelector('[data-slot=skeleton]')).toBeNull();
});

it('UiLabel shows a skeleton only until its own text is translated', async () => {
  const request = holdFetch();
  render(<I18nProvider language="ar"><nav><UiLabel text="Tara" /></nav></I18nProvider>);
  expect(document.querySelector('[data-slot=skeleton]')).not.toBeNull();
  request.answer({ language: 'ar', dir: 'rtl', texts: { Tara: 'مسح' } });
  expect(await screen.findByText('مسح')).toBeInTheDocument();
  expect(document.querySelector('[data-slot=skeleton]')).toBeNull();
});

it('UiLabel falls back to Turkish (no endless skeleton) when the text cannot be translated', async () => {
  mockApi({}); // 404 for /ui-texts
  render(<I18nProvider language="ar"><nav><UiLabel text="Tara" /></nav></I18nProvider>);
  await expect.poll(() => document.querySelector('[data-slot=skeleton]')).toBeNull();
  expect(screen.getByRole('navigation')).toHaveTextContent('Tara');
});
