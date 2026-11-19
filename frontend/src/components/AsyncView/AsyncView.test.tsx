import { render, screen } from '@testing-library/react';
import { ApiError } from '../../api';
import { AsyncView } from './AsyncView';

describe('AsyncView', () => {
  it('shows a spinner while loading', () => {
    render(<AsyncView state={{ status: 'loading' }}>{() => 'x'}</AsyncView>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  it('shows the error', () => {
    render(<AsyncView state={{ status: 'error', error: new ApiError(404, null) }}>{() => 'x'}</AsyncView>);
    expect(screen.getByRole('alert')).toHaveTextContent('Bulunamadı.');
  });
  it('renders children with data', () => {
    render(<AsyncView state={{ status: 'ok', data: { n: 5 } }}>{(d) => <p>n={d.n}</p>}</AsyncView>);
    expect(screen.getByText('n=5')).toBeInTheDocument();
  });
});
