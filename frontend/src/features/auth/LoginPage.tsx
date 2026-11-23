import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import type { LoginIn } from '../../api';
import { AuthShell } from './components/AuthShell';
import { DemoLogin } from './components/DemoLogin';
import { LoginForm } from './components/LoginForm';
import { HOME_BY_ROLE } from './constants';
import { useAuth } from './hooks/useAuth';
import { fromState } from './redirect';
import { useT } from '../../i18n';

/** After login, return to the page the user was going to (e.g. the scanned machine), else the role's home. */
export function LoginPage() {
  const t = useT();
  const { auth, signIn } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = fromState(state);

  if (auth.status === 'user') return <Navigate to={from ?? HOME_BY_ROLE[auth.me.role]} replace />;

  async function submit(body: LoginIn) {
    const me = await signIn(body);
    navigate(from ?? HOME_BY_ROLE[me.role], { replace: true });
  }

  return (
    <AuthShell title={t('Giriş')}>
      <p className="muted" style={{ margin: 0 }}>{t('Bir kez giriş yapın, telefonunuzda açık kalır.')}</p>
      {import.meta.env.VITE_MOCK === '1' && <DemoLogin onLogin={(body) => void submit(body)} />}
      <LoginForm onSubmit={submit} />
      <p className="muted" style={{ margin: 0 }}>
        {t('Hesabınız yok mu?')}{' '}<Link to="/register" state={state}>{t('Kayıt ol')}</Link>
      </p>
    </AuthShell>
  );
}
