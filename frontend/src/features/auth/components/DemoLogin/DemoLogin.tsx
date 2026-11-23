import type { LoginIn } from '../../../../api';
import { useT } from '../../../../i18n';

// Must match DEMO_LOGINS in src/mock/db.ts.
const USERS: [string, string][] = [['isci', '👷 İşçi'], ['usta', '🧰 Usta'], ['teknisyen', '🔧 Teknisyen'], ['patron', '📊 Patron']];

/** Mock mode only: one tap logs in as a fake user of that role. */
export function DemoLogin({ onLogin }: { onLogin: (body: LoginIn) => void }) {
  const t = useT();
  return (
    <section className="card warn stack" aria-label={t('Demo kullanıcıları')}>
      <div className="strong">{t('Demo modu · sahte veri')}</div>
      <div className="chips">
        {USERS.map(([login, label]) => (
          <button key={login} type="button" className="chip" onClick={() => onLogin({ login, password: 'demo' })}>
            {label}
          </button>
        ))}
      </div>
      <span className="muted">{t('veya kullanıcı adı olarak isci / usta / teknisyen / patron yazın, şifre fark etmez.')}</span>
    </section>
  );
}
