import { useState, type FormEvent } from 'react';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
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
    <form onSubmit={submit}>
      <Card className="gap-2">
        <Label htmlFor="machine-code" className="text-sm text-muted-foreground">{t('QR okunmuyorsa makine kodunu yazın')}</Label>
        <div className="flex gap-2">
          <Input id="machine-code" className="font-mono uppercase placeholder:font-sans placeholder:normal-case" placeholder={t('Örn. PK-105')} autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" size="small" className="h-11 px-5" loading={pending} disabled={!code.trim()}>{t('Aç')}</Button>
        </div>
      </Card>
    </form>
  );
}
