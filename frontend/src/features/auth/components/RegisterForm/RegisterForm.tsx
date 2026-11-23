import { useState, type FormEvent } from 'react';
import type { RegisterIn, RegisterRole } from '../../../../api';
import { errorMessage } from '../../../../api';
import { Button } from '../../../../components/Button';
import { Field } from '../../../../components/Field';
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
    <form className="card stack" onSubmit={submit} noValidate>
      <fieldset className="field">
        <legend className="label">{t('Rol')}</legend>
        <div className="chips">
          {ROLES.map((r) => (
            <button key={r} type="button" className="chip" aria-pressed={role === r} onClick={() => setRole(r)}>
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </fieldset>
      <Field label={t('Ad soyad')} htmlFor="name">
        <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={t('Telefon veya e-posta')} htmlFor="login">
        <input id="login" autoComplete="username" inputMode="email" value={login} onChange={(e) => setLogin(e.target.value)} />
      </Field>
      <Field label={t('Şifre (en az 8 karakter)')} htmlFor="password">
        <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <div className="alert-error" role="alert">{error}</div>}
      <Button type="submit" loading={pending}>{t('Kayıt ol')}</Button>
    </form>
  );
}
