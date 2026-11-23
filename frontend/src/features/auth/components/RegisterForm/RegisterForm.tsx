import { useState, type FormEvent } from 'react';
import type { RegisterIn, RegisterRole } from '../../../../api';
import { errorMessage } from '../../../../api';
import { Button } from '../../../../components/Button';
import { Chip } from '../../../../components/Chip';
import { Field } from '../../../../components/Field';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { ROLE_LABEL } from '../../constants';
import { useT } from '../../../../i18n';

const ROLES: RegisterRole[] = ['worker', 'usta'];

/** Sign-up form. Only checks that fields are filled; the backend validates and returns Turkish messages. */
export function RegisterForm({ onSubmit }: { onSubmit: (body: RegisterIn) => Promise<unknown> }) {
  const t = useT();
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RegisterRole>('worker');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !login.trim() || !password) return setError('Ad, telefon/e-posta ve şifre girin.');
    setPending(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), login: login.trim(), password, role });
    } catch (err: unknown) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Card>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('Rol')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <Chip key={r} aria-pressed={role === r} onClick={() => setRole(r)} className="h-11 justify-center rounded-lg">
              {ROLE_LABEL[r]}
            </Chip>
          ))}
        </div>
      </fieldset>
      <Field label={t('Ad soyad')} htmlFor="name">
        <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={t('Telefon veya e-posta')} htmlFor="login">
        <Input id="login" autoComplete="username" inputMode="email" value={login} onChange={(e) => setLogin(e.target.value)} />
      </Field>
      <Field label={t('Şifre (en az 8 karakter)')} htmlFor="password">
        <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <Alert variant="destructive" className="border-destructive/30 bg-destructive/5"><AlertDescription className="text-destructive">{t(error)}</AlertDescription></Alert>}
      <Button type="submit" loading={pending}>{t('Kayıt ol')}</Button>
      </Card>
    </form>
  );
}
