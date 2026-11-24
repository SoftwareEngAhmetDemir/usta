import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it } from 'vitest';
import { I18nProvider, useT } from '../../../i18n';
import { holdFetch, mockApi } from '../../../test/utils';
import { UiBusyNowContext } from '../../../i18n/context';
import { LanguageGate } from './LanguageGate';

function Page() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <h1>{t('Makine')}</h1>
      <button type="button" onClick={() => setOpen(true)}>{t('Aç')}</button>
      {open && <p>{t('Ara…')}</p>}
    </>
  );
}

const gate = (language: string) => (
  <MemoryRouter>
    <I18nProvider language={language}>
      <LanguageGate languageName="العربية" enabled={language !== 'tr'}><Page /></LanguageGate>
    </I18nProvider>
  </MemoryRouter>
);

beforeEach(() => localStorage.clear());

it('LanguageGate shows a skeleton instead of the page until its texts are translated', async () => {
  const request = holdFetch();
  render(gate('ar'));
  expect(await screen.findByRole('status')).toHaveTextContent('العربية…');
  expect(screen.queryByRole('heading')).not.toBeInTheDocument(); // rendered (so it asks for its texts) but hidden
  request.answer({ language: 'ar', dir: 'rtl', texts: { Makine: 'آلة', Aç: 'فتح' } });
  expect(await screen.findByRole('heading', { name: 'آلة' }, { timeout: 3000 })).toBeVisible(); // shown after a 150 ms quiet period
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('LanguageGate never hides a shown page again for texts that appear later (a dropdown, an answer)', async () => {
  localStorage.setItem('ui-texts:ar', JSON.stringify({ dir: 'rtl', texts: { Makine: 'آلة', Aç: 'فتح' } }));
  holdFetch(); // the dropdown's text stays on its way
  render(gate('ar'));
  const heading = await screen.findByRole('heading', { name: 'آلة' }, { timeout: 3000 });
  await userEvent.click(screen.getByRole('button', { name: 'فتح' }));
  await new Promise((r) => setTimeout(r, 250)); // its batch is out
  expect(heading).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByText('Ara…')).toBeVisible(); // Turkish until its translation arrives
});

it('LanguageGate is off in Turkish: the page shows straight away', () => {
  mockApi({});
  render(gate('tr'));
  expect(screen.getByRole('heading', { name: 'Makine' })).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('LanguageGate keeps the page hidden when its texts are still queued as the quiet timer fires (slow phone)', async () => {
  let busy = true; // texts collected by the render, their 30 ms batch not sent yet: `loading` still says false
  render(
    <MemoryRouter>
      <UiBusyNowContext.Provider value={() => busy}>
        <LanguageGate languageName="العربية" enabled><h1>Makine</h1></LanguageGate>
      </UiBusyNowContext.Provider>
    </MemoryRouter>,
  );
  await new Promise((r) => setTimeout(r, 300)); // past the 150 ms quiet period
  expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('العربية…');
  busy = false;
});
