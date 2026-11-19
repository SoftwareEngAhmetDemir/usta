import { render, screen } from '@testing-library/react';
import { me } from '../../../../test/fixtures';
import { MeCard } from './MeCard';

describe('MeCard', () => {
  it('shows an authorized technician with his certificate note', () => {
    render(<MeCard me={me('technician')} note="giriş yapan kullanıcı" />);
    expect(screen.getByText('Yetkili')).toBeInTheDocument();
    expect(screen.getByText(/Forklift periyodik bakım yetki belgesi/)).toHaveTextContent('giriş yapan kullanıcı');
  });
  it('shows a non-authorized user', () => {
    render(<MeCard me={me('usta')} />);
    expect(screen.getByText('Yetki belgesi yok')).toBeInTheDocument();
  });
});
