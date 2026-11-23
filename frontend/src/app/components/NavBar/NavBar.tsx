import { NavLink } from 'react-router';
import type { NavItem } from '../../nav';
import { UiLabel, useT } from '../../../i18n';

export function NavBar({ items }: { items: NavItem[] }) {
  const t = useT();
  return (
    <nav
      className="sticky bottom-0 z-20 grid auto-cols-fr grid-flow-col border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden"
      aria-label={t('Ana menü')}
    >
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/usta' || to === '/panel'}
          className="group flex flex-col items-center gap-1 pt-2.5 pb-3 text-xs font-medium text-muted-foreground no-underline transition-colors hover:text-steel aria-[current=page]:text-steel"
        >
          <span className="grid h-7 w-12 place-items-center rounded-full transition-colors group-aria-[current=page]:bg-accent" aria-hidden="true">
            <Icon className="size-5" strokeWidth={2.2} />
          </span>
          <UiLabel text={label} />
        </NavLink>
      ))}
    </nav>
  );
}
