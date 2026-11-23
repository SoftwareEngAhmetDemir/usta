import { Link, Outlet, useLocation } from 'react-router';
import { AlertBell, AlertToast, useAlerts } from '../../../features/alerts';
import { ROLE_LABEL, useAuth, useMe } from '../../../features/auth';
import { LanguageMenu, useLanguageSwitch } from '../../../features/language';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { NAV } from '../../nav';
import { LanguageLoading } from '../LanguageLoading';
import { NavBar } from '../NavBar';
import { useT } from '../../../i18n';

/** Phone-first shell: header with bell, site language menu and sign-out, live alert toast, page, bottom menu.
 * The patron panel is wide. */
export function AppLayout() {
  const t = useT();
  const me = useMe();
  const { signOut } = useAuth();
  const { list, toast, open } = useAlerts();
  const lang = useLanguageSwitch();
  const wide = useLocation().pathname.startsWith('/panel');

  return (
    <div className={wide ? 'shell wide' : 'shell'}>
      <header className="apphead">
        <Link className="brand" to="/">Usta Hafızası</Link>
        <span className="muted" style={{ color: '#cfe0ea' }}>{t(ROLE_LABEL[me.role])}</span>
        <AlertBell unread={list.unread_count} />
        <LanguageMenu languages={lang.languages} current={lang.current} onChoose={(code) => void lang.choose(code)} />
        <button type="button" className="iconbtn" style={{ fontSize: 14, padding: "0 10px" }} onClick={() => void signOut()}>{t('Çıkış yap')}</button>
      </header>
      <LanguageLoading languageName={me.language_name} />
      <AlertToast alert={toast} onOpen={open} />
      <main className="content">
        <ErrorMessage error={lang.error} />
        {/* keyed by language: choosing another one re-opens the page, so everything reloads in it */}
        <Outlet key={me.language} />
      </main>
      <NavBar items={NAV[me.role]} />
    </div>
  );
}
