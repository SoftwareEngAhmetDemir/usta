import { ShieldCheck, Wrench } from 'lucide-react';
import type { Me } from '../../../../api';
import { Pill } from '../../../../components/Pill';
import { Card } from '../../../../components/ui/card';
import { cn } from 'cn';
import { useT } from '../../../../i18n';

/** The logged-in technician with his authorized status (KAN-26). */
export function MeCard({ me, note }: { me: Me; note?: string }) {
  const t = useT();
  return (
    <Card className="flex-row items-center gap-3">
      <span className={cn('grid size-12 shrink-0 place-items-center rounded-xl text-white', me.authorized ? 'bg-success' : 'bg-steel')} aria-hidden="true">
        {me.authorized ? <ShieldCheck className="size-6" /> : <Wrench className="size-6" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="font-semibold">{me.name}</div>
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {me.authorized ? <Pill tone="ok">{t('Yetkili')}</Pill> : <Pill tone="warn">{t('Yetki belgesi yok')}</Pill>} {me.authorization_note}
          {note && <> · {note}</>}
        </div>
      </div>
    </Card>
  );
}
