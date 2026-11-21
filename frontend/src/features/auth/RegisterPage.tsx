import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import type { RegisterIn } from '../../api';
import { AuthShell } from './components/AuthShell';
import { RegisterForm } from './components/RegisterForm';
import { HOME_BY_ROLE } from './constants';
import { useAuth } from './hooks/useAuth';
import { fromState } from './redirect';

/** Self sign-up as İşçi or Usta. Afterwards it goes where login would: the scanned machine, else the role home. */
export function RegisterPage() {
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
    <AuthShell title="Kayıt ol">
      <p className="muted" style={{ margin: 0 }}>İşçi veya Usta olarak kayıt olabilirsiniz; Teknisyen ve Patron yetkisini patron verir.</p>
      <RegisterForm onSubmit={submit} />
      <p className="muted" style={{ margin: 0 }}>
        Zaten hesabınız var mı? <Link to="/login" state={state}>Giriş yap</Link>
      </p>
    </AuthShell>
  );
}
