import { Navigate, useLocation, useNavigate } from 'react-router';
import type { LoginIn } from '../../api';
import { DemoLogin } from './components/DemoLogin';
import { LoginForm } from './components/LoginForm';
import { HOME_BY_ROLE } from './constants';
import { useAuth } from './hooks/useAuth';

function fromState(state: unknown): string | null {
  if (state && typeof state === 'object' && 'from' in state && typeof state.from === 'string') return state.from;
  return null;
}

/** After login, return to the page the user was going to (e.g. the scanned machine), else the role's home. */
export function LoginPage() {
  const { auth, signIn } = useAuth();
  const navigate = useNavigate();
  const from = fromState(useLocation().state);

  if (auth.status === 'user') return <Navigate to={from ?? HOME_BY_ROLE[auth.me.role]} replace />;

  async function submit(body: LoginIn) {
    const me = await signIn(body);
    navigate(from ?? HOME_BY_ROLE[me.role], { replace: true });
  }

  return (
    <main className="shell">
      <div className="apphead"><span className="brand">Usta Hafızası</span></div>
      <div className="content">
        <div className="pagetitle"><h1>Giriş</h1></div>
        <p className="muted" style={{ margin: 0 }}>Bir kez giriş yapın, telefonunuzda açık kalır.</p>
        {import.meta.env.VITE_MOCK === '1' && <DemoLogin onLogin={(body) => void submit(body)} />}
        <LoginForm onSubmit={submit} />
      </div>
    </main>
  );
}
