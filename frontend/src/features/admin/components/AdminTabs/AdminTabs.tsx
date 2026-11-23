import { ExternalLink } from 'lucide-react';
import { NavLink } from 'react-router';
import { useT } from '../../../../i18n';

const tab = 'inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-steel no-underline transition-colors hover:bg-muted';
const TABS: [string, string][] = [['/panel', 'Makineler'], ['/panel/stickers', 'QR etiketleri'], ['/panel/users', 'Kullanıcılar']];

export function AdminTabs() {
  const t = useT();
  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1 print:hidden" aria-label={t('Yönetim')}>
      {TABS.map(([to, label]) => (
        <NavLink key={to} to={to} end className={`${tab} aria-[current=page]:bg-steel aria-[current=page]:text-steel-foreground aria-[current=page]:shadow-sm`}>{t(label)}</NavLink>
      ))}
      <a href="/admin" target="_blank" rel="noreferrer" className={`${tab} ms-auto gap-1.5`}>{t('Kayıtları düzenle')}<ExternalLink className="size-3.5" aria-hidden="true" /></a>
    </nav>
  );
}
