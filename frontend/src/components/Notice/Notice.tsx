import { CircleAlert, CircleCheck, Info, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from 'cn';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type Tone = 'info' | 'waiting' | 'ok' | 'bad';

const STYLE: Record<Tone, string> = {
  info: 'border-steel/25 bg-secondary/60 text-foreground [&>svg]:text-steel',
  waiting: 'border-primary/50 bg-accent/50 text-foreground [&>svg]:text-warning',
  ok: 'border-success/30 bg-success/8 text-foreground [&>svg]:text-success',
  bad: 'border-destructive/30 bg-destructive/5 text-destructive',
};
const ICON: Record<Tone, ReactNode> = {
  info: <Info aria-hidden="true" />,
  waiting: <Loader2 className="animate-spin" aria-hidden="true" />,
  ok: <CircleCheck aria-hidden="true" />,
  bad: <CircleAlert aria-hidden="true" />,
};

/** A message box about the state of something (processing, saved, not allowed). `bad` is announced as an alert. */
export function Notice({ tone, title, children }: { tone: Tone; title?: ReactNode; children?: ReactNode }) {
  return (
    <Alert role={tone === 'bad' ? 'alert' : 'status'} className={cn('rounded-xl', STYLE[tone])}>
      {ICON[tone]}
      {title && <AlertTitle className="line-clamp-none font-semibold">{title}</AlertTitle>}
      {children && <AlertDescription className={cn('text-sm', tone === 'bad' ? 'text-destructive' : 'text-muted-foreground')}>{children}</AlertDescription>}
    </Alert>
  );
}
