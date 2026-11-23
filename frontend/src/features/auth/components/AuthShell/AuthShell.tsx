import { HardHat } from 'lucide-react';
import type { ReactNode } from 'react';
import { useT } from '../../../../i18n';

/** Frame of the public auth screens (login, register): brand header + title + content. */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-background">
      <div className="relative overflow-hidden bg-steel px-5 pt-10 pb-8 text-white">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(255,255,255,.04)_14px_28px)]" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md" aria-hidden="true">
            <HardHat className="size-7" />
          </span>
          <div>
            <div className="font-display text-3xl leading-none font-bold tracking-wide uppercase">Usta Hafızası</div>
            <div className="mt-1 text-sm text-white/70">{t('Makinenin bilgisi, ustanın tecrübesi')}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-4 pt-6 pb-8">
        <h1 className="m-0 font-display text-3xl leading-none font-semibold tracking-wide text-steel uppercase">{title}</h1>
        {children}
      </div>
    </main>
  );
}
