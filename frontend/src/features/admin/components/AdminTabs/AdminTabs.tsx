import { NavLink } from 'react-router';
import { useT } from '../../../../i18n';

const TABS: [string, string][] = [['/panel', 'Makineler'], ['/panel/stickers', 'QR etiketleri'], ['/panel/users', 'Kullanıcılar']];

export function AdminTabs() {
  const t = useT();
  return (
    <nav className="tabs no-print" aria-label={t('Yönetim')}>
      {TABS.map(([to, label]) => <NavLink key={to} to={to} end>{t(label)}</NavLink>)}
      <a href="/admin" target="_blank" rel="noreferrer">{t('Kayıtları düzenle ↗')}</a>
    </nav>
  );
}
