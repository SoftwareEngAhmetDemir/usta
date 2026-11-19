import { screen } from '@testing-library/react';
import { processing } from '../../../../test/fixtures';
import { mockApi, renderAt } from '../../../../test/utils';
import { ProcessingPanel } from './ProcessingPanel';

describe('ProcessingPanel', () => {
  it('shows the steps and the ready state from the backend', async () => {
    mockApi({ 'GET /videos/9/processing': { ...processing, status: 'ready', steps: processing.steps.map((s) => ({ ...s, status: 'done' })) } });
    renderAt(<ProcessingPanel initial={processing} onAgain={() => {}} />);
    expect(screen.getByText('Sıkıştırılıyor (H.264)')).toBeInTheDocument();
    expect(await screen.findByText('Hazır')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Videoyu aç' })).toHaveAttribute('href', '/videos/9');
  });
});
