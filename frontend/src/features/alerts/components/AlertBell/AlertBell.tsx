import { Link } from 'react-router';

export function AlertBell({ unread }: { unread: number }) {
  return (
    <Link className="iconbtn" to="/alerts" aria-label={unread ? `Bildirimler, ${unread} okunmamış` : 'Bildirimler'}>
      🔔{unread > 0 && <span className="count" aria-hidden="true">{unread}</span>}
    </Link>
  );
}
