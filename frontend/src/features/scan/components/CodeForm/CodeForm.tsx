import { useState, type FormEvent } from 'react';
import { Button } from '../../../../components/Button';
import { useT } from '../../../../i18n';

/** Fallback when the QR cannot be read: type the code printed under it (e.g. PK-105). */
export function CodeForm({ pending, onSubmit }: { pending: boolean; onSubmit: (code: string) => void }) {
  const t = useT();
  const [code, setCode] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    if (code.trim()) onSubmit(code.trim().toUpperCase());
  }
  return (
    <form className="card stack" onSubmit={submit}>
      <label className="label" htmlFor="machine-code">{t('QR okunmuyorsa makine kodunu yazın')}</label>
      <div className="row">
        <div className="field grow"><input id="machine-code" placeholder={t('Örn. PK-105')} autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value)} /></div>
        <Button type="submit" size="small" loading={pending} disabled={!code.trim()}>{t('Aç')}</Button>
      </div>
    </form>
  );
}
