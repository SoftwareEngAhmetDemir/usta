import { screen } from '@testing-library/react';
import { me } from '../../../test/fixtures';
import { mockApi, renderAuthed } from '../../../test/utils';
import { HomeRedirect } from './HomeRedirect';

it('HomeRedirect sends each role to its home', async () => {
  mockApi({ 'GET /auth/me': me('technician') });
  renderAuthed(<HomeRedirect />, '/', '/');
  expect(await screen.findByText('other page /maintenance')).toBeInTheDocument();
});
