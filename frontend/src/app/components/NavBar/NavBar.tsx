import { NavLink } from 'react-router';
import type { NavItem } from '../../nav';

export function NavBar({ items }: { items: NavItem[] }) {
  return (
    <nav className="navbar" aria-label="Ana menü">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.to === '/usta' || i.to === '/panel'}>
          <span className="ic" aria-hidden="true">{i.icon}</span>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
