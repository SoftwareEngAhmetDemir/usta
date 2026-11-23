import { Bell } from 'lucide-react';
import { Link } from 'react-router';
import { useT } from '../../../../i18n';

export function AlertBell({ unread }: { unread: number }) {
  const t = useT();
  return (
    <Link
      to="/alerts"
      aria-label={unread ? `${t('Bildirimler')}, ${unread} ${t('okunmamış')}` : t('Bildirimler')}
      className="relative grid size-10 shrink-0 place-items-center rounded-lg bg-white/12 text-white transition-colors hover:bg-white/20"
    >
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute -end-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground ring-2 ring-steel" aria-hidden="true">
          {unread}
        </span>
      )}
    </Link>
  );
}
