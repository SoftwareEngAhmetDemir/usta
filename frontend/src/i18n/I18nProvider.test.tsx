import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { holdFetch, mockApi } from '../test/utils';
import { I18nProvider } from './I18nProvider';
import { useT } from './useT';
import { useUiLoading } from './useUiLoading';

function Header() {
  const t = useT();
  const loading = useUiLoading();
  return (
    <>
      <button type="button">{t('Çıkış yap')} · {t('Sor')}</button>
      {loading && <p>loading</p>}
    </>
  );
}

const arabic = { language: 'ar', dir: 'rtl', texts: { 'Çıkış yap': 'تسجيل الخروج', Sor: 'اسأل' } };

describe('I18nProvider', () => {
  beforeEach(() => localStorage.clear());

  it('shows Turkish as written and asks the backend nothing', () => {
    const { calls } = mockApi({});
    render(<I18nProvider language="tr"><Header /></I18nProvider>);
    expect(screen.getByRole('button')).toHaveTextContent('Çıkış yap · Sor');
    expect(calls).toEqual([]);
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });

  it('translates the UI in one request, turns the page right to left and remembers it', async () => {
    const { calls } = mockApi({ 'POST /ui-texts': arabic });
    const { unmount } = render(<I18nProvider language="ar"><Header /></I18nProvider>);
    expect(screen.getByRole('button')).toHaveTextContent('Çıkış yap · Sor'); // Turkish until it arrives
    expect(await screen.findByRole('button', { name: 'تسجيل الخروج · اسأل' })).toBeInTheDocument();
    expect(calls).toEqual([{ method: 'POST', path: '/ui-texts', body: { texts: ['Çıkış yap', 'Sor'] } }]);
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    unmount();
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');

    const again = mockApi({});
    render(<I18nProvider language="ar"><Header /></I18nProvider>);
    expect(screen.getByRole('button')).toHaveTextContent('تسجيل الخروج · اسأل'); // from this browser's store
    expect(again.calls).toEqual([]);
  });

  it('is loading while the texts are on their way', async () => {
    const request = holdFetch();
    render(<I18nProvider language="ar"><Header /></I18nProvider>);
    expect(await screen.findByText('loading')).toBeInTheDocument();
    request.answer(arabic);
    expect(await screen.findByRole('button', { name: 'تسجيل الخروج · اسأل' })).toBeInTheDocument();
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
  });

  it('translates quiet texts (live alerts, errors) without showing the page as loading', async () => {
    function Toast() {
      const t = useT();
      const loading = useUiLoading();
      return <><p>{t('Yeni soru geldi', { quiet: true })}</p>{loading && <p>loading</p>}</>;
    }
    const request = holdFetch();
    render(<I18nProvider language="ar"><Toast /></I18nProvider>);
    await new Promise((r) => setTimeout(r, 60)); // the batch has been sent
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
    request.answer({ language: 'ar', dir: 'rtl', texts: { 'Yeni soru geldi': 'وصل سؤال جديد' } });
    expect(await screen.findByText('وصل سؤال جديد')).toBeInTheDocument();
  });

  it('keeps Turkish when the backend cannot translate', async () => {
    const { calls } = mockApi({}); // 404 for /ui-texts
    render(<I18nProvider language="en"><Header /></I18nProvider>);
    await expect.poll(() => calls.length).toBe(1);
    await expect.poll(() => screen.queryByText('loading')).toBeNull(); // a failed request ends the loading too
    expect(screen.getByRole('button')).toHaveTextContent('Çıkış yap · Sor');
  });

  it('works without a provider (login page, unit tests): Turkish', () => {
    render(<Header />);
    expect(screen.getByRole('button')).toHaveTextContent('Çıkış yap · Sor');
  });
});
