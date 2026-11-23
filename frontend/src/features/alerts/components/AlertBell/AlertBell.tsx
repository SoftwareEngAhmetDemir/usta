import { Link } from 'react-router';
import { useT } from '../../../../i18n';

export function AlertBell({ unread }: { unread: number }) {
  const t = useT();
  return (
    <Link className="iconbtn" to="/alerts" aria-label={unread ? `${t('Bildirimler')}, ${unread} ${t('okunmamış')}` : t('Bildirimler')}>
      🔔{unread > 0 && <span className="count" aria-hidden="true">{unread}</span>}
    </Link>
  );
}
