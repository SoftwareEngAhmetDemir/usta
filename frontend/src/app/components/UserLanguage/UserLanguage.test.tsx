import { screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { useT } from '../../../i18n';
import { me } from '../../../test/fixtures';
import { mockApi, renderAuthed } from '../../../test/utils';
import { UserLanguage } from './UserLanguage';

function Hello() {
  const t = useT();
  return <p>{t('Merhaba')}</p>;
}

beforeEach(() => localStorage.clear());

it("UserLanguage shows the UI in the signed-in user's site language", async () => {
  mockApi({
    'GET /auth/me': { ...me('worker'), language: 'en', language_name: 'English' },
    'POST /ui-texts': { language: 'en', dir: 'ltr', texts: { Merhaba: 'Hello' } },
  });
  renderAuthed(<UserLanguage><Hello /></UserLanguage>);
  expect(await screen.findByText('Hello')).toBeInTheDocument();
});
