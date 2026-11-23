import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import type { RegisterIn } from '../../api';
import { AuthShell } from './components/AuthShell';
import { RegisterForm } from './components/RegisterForm';
import { HOME_BY_ROLE } from './constants';
import { useAuth } from './hooks/useAuth';
import { fromState } from './redirect';
import { useT } from '../../i18n';

/** Self sign-up as İşçi or Usta. Afterwards it goes where login would: the scanned machine, else the role home. */
export function RegisterPage() {
  const t = useT();
  const { auth, signUp } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = fromState(state);

  if (auth.status === 'user') return <Navigate to={from ?? HOME_BY_ROLE[auth.me.role]} replace />;

  async function submit(body: RegisterIn) {
    const me = await signUp(body);
    navigate(from ?? HOME_BY_ROLE[me.role], { replace: true });
  }

  return (
    <AuthShell title={t('Kayıt ol')}>
      <p className="m-0 text-sm text-muted-foreground">{t('İşçi veya Usta olarak kayıt olabilirsiniz; Teknisyen ve Patron yetkisini patron verir.')}</p>
      <RegisterForm onSubmit={submit} />
      <p className="m-0 text-sm text-muted-foreground">
        {t('Zaten hesabınız var mı?')}{' '}<Link to="/login" state={state} className="font-semibold text-steel underline underline-offset-4">{t('Giriş yap')}</Link>
      </p>
    </AuthShell>
  );
}
