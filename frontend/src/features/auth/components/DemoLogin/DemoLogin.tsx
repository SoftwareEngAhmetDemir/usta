import type { LoginIn } from '../../../../api';
import { Chip } from '../../../../components/Chip';
import { Card } from '../../../../components/ui/card';
import { useT } from '../../../../i18n';

// Must match DEMO_LOGINS in src/mock/db.ts.
const USERS: [string, string][] = [['isci', '👷 İşçi'], ['usta', '🧰 Usta'], ['teknisyen', '🔧 Teknisyen'], ['patron', '📊 Patron']];

/** Mock mode only: one tap logs in as a fake user of that role. */
export function DemoLogin({ onLogin }: { onLogin: (body: LoginIn) => void }) {
  const t = useT();
  return (
    <Card asChild className="border-primary/50 bg-accent/60"><section aria-label={t('Demo kullanıcıları')}>
      <div className="font-semibold">{t('Demo modu · sahte veri')}</div>
      <div className="flex flex-wrap gap-2">
        {USERS.map(([login, label]) => (
          <Chip key={login} onClick={() => onLogin({ login, password: 'demo' })}>{label}</Chip>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{t('veya kullanıcı adı olarak isci / usta / teknisyen / patron yazın, şifre fark etmez.')}</span>
    </section></Card>
  );
}
