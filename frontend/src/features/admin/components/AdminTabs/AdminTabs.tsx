import { NavLink } from 'react-router';

const TABS: [string, string][] = [['/panel', 'Makineler'], ['/panel/stickers', 'QR etiketleri'], ['/panel/users', 'Kullanıcılar']];

export function AdminTabs() {
  return (
    <nav className="tabs no-print" aria-label="Yönetim">
      {TABS.map(([to, label]) => <NavLink key={to} to={to} end>{label}</NavLink>)}
      <a href="/admin" target="_blank" rel="noreferrer">Kayıtları düzenle ↗</a>
    </nav>
  );
}
