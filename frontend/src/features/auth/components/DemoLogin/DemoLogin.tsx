import type { LoginIn } from '../../../../api';

// Must match DEMO_LOGINS in src/mock/db.ts.
const USERS: [string, string][] = [['isci', '👷 İşçi'], ['usta', '🧰 Usta'], ['teknisyen', '🔧 Teknisyen'], ['patron', '📊 Patron']];

/** Mock mode only: one tap logs in as a fake user of that role. */
export function DemoLogin({ onLogin }: { onLogin: (body: LoginIn) => void }) {
  return (
    <section className="card warn stack" aria-label="Demo kullanıcıları">
      <div className="strong">Demo modu · sahte veri</div>
      <div className="chips">
        {USERS.map(([login, label]) => (
          <button key={login} type="button" className="chip" onClick={() => onLogin({ login, password: 'demo' })}>
            {label}
          </button>
        ))}
      </div>
      <span className="muted">veya kullanıcı adı olarak isci / usta / teknisyen / patron yazın, şifre fark etmez.</span>
    </section>
  );
}
