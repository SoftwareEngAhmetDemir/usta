import type { ReactNode } from 'react';
import { cn } from 'cn';
import { Badge } from '../ui/badge';
import { TONE_CLASS, type PillTone } from './tones';

export function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <Badge data-tone={tone} className={cn('font-semibold', TONE_CLASS[tone])}>{children}</Badge>;
}
