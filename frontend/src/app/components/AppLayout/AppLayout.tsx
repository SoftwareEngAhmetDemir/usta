import { Link, Outlet, useLocation } from 'react-router';
import { AlertBell, AlertToast, useAlerts } from '../../../features/alerts';
import { ROLE_LABEL, useAuth, useMe } from '../../../features/auth';
import { NAV } from '../../nav';
import { NavBar } from '../NavBar';

/** Phone-first shell: header with bell, live alert toast, page, bottom menu. The patron panel is wide. */
export function AppLayout() {
  const me = useMe();
  const { signOut } = useAuth();
  const { list, toast, open } = useAlerts();
  const wide = useLocation().pathname.startsWith('/panel');

  return (
    <div className={wide ? 'shell wide' : 'shell'}>
      <header className="apphead">
        <Link className="brand" to="/">Usta Hafızası</Link>
        <span className="muted" style={{ color: '#cfe0ea' }}>{ROLE_LABEL[me.role]}</span>
        <AlertBell unread={list.unread_count} />
        <button type="button" className="iconbtn" style={{ fontSize: 14, padding: "0 10px" }} onClick={() => void signOut()}>Çıkış yap</button>
      </header>
      <AlertToast alert={toast} onOpen={open} />
      <main className="content">
        <Outlet />
      </main>
      <NavBar items={NAV[me.role]} />
    </div>
  );
}
