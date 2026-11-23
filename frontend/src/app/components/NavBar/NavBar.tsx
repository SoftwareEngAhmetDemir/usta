import { NavLink } from 'react-router';
import type { NavItem } from '../../nav';
import { useT } from '../../../i18n';

export function NavBar({ items }: { items: NavItem[] }) {
  const t = useT();
  return (
    <nav className="navbar" aria-label={t('Ana menü')}>
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.to === '/usta' || i.to === '/panel'}>
          <span className="ic" aria-hidden="true">{i.icon}</span>
          {t(i.label)}
        </NavLink>
      ))}
    </nav>
  );
}
