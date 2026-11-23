import { useState, type FormEvent } from 'react';
import type { LoginIn } from '../../../../api';
import { ApiError, errorMessage } from '../../../../api';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';
import { useT } from '../../../../i18n';

function loginError(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return 'Telefon/e-posta veya şifre hatalı.';
  return errorMessage(error);
}

export function LoginForm({ onSubmit }: { onSubmit: (body: LoginIn) => Promise<unknown> }) {
  const t = useT();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!login.trim() || !password) return setError('Telefon/e-posta ve şifre girin.');
    setPending(true);
    setError(null);
    try {
      await onSubmit({ login: login.trim(), password });
    } catch (err: unknown) {
      setError(loginError(err));
      setPending(false);
    }
  }

  return (
    <form className="card stack" onSubmit={submit} noValidate>
      <Field label={t('Telefon veya e-posta')} htmlFor="login">
        <input id="login" autoComplete="username" inputMode="email" value={login} onChange={(e) => setLogin(e.target.value)} />
      </Field>
      <Field label={t('Şifre')} htmlFor="password">
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <div className="alert-error" role="alert">{error}</div>}
      <Button type="submit" loading={pending}>{t('Giriş yap')}</Button>
    </form>
  );
}
