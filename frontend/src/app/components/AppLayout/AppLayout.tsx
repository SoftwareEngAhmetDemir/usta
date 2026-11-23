import { HardHat, LogOut } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';
import { cn } from 'cn';
import { AlertBell, AlertToast, useAlerts } from '../../../features/alerts';
import { ROLE_LABEL, useAuth, useMe } from '../../../features/auth';
import { LanguageMenu, useLanguageSwitch } from '../../../features/language';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { NAV } from '../../nav';
import { LanguageGate } from '../LanguageGate';
import { NavBar } from '../NavBar';
import { UiLabel, useT } from '../../../i18n';

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
    <div className={cn('mx-auto flex min-h-dvh w-full flex-col bg-background sm:border-x', wide ? 'max-w-6xl' : 'max-w-xl')}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 bg-steel px-3 text-steel-foreground shadow-md print:hidden">
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 text-white no-underline">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
            <HardHat className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-xl font-bold tracking-wide uppercase">Usta Hafızası</span>
            <span className="truncate text-xs text-white/70"><UiLabel text={ROLE_LABEL[me.role]} skeletonClassName="mt-1 w-14 bg-white/20" /></span>
          </span>
        </Link>
        <AlertBell unread={list.unread_count} />
        <LanguageMenu languages={lang.languages} current={lang.current} onChoose={(code) => void lang.choose(code)} />
        <button
          type="button"
          title={t('Çıkış yap')}
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/12 text-white transition-colors hover:bg-white/20 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
          onClick={() => void signOut()}
        >
          <LogOut className="size-5 rtl:rotate-180" aria-hidden="true" />
          <span className="sr-only">{t('Çıkış yap')}</span>
        </button>
      </header>
      <AlertToast alert={toast} onOpen={open} />
      <main className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-8">
        <ErrorMessage error={lang.error} />
        <LanguageGate languageName={me.language_name}>
          {/* keyed by language: choosing another one re-opens the page, so everything reloads in it */}
          <Outlet key={me.language} />
        </LanguageGate>
      </main>
      <NavBar items={NAV[me.role]} />
    </div>
  );
}
