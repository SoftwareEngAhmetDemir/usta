import { Cpu, FileText, MessageCircleQuestion, Video, Wrench, type LucideIcon } from 'lucide-react';
import type { AdminStats } from '../../../../api';
import { Card } from '../../../../components/ui/card';
import { useT } from '../../../../i18n';

const LABELS: [keyof AdminStats, string, LucideIcon][] = [
  ['machines', 'makine', Cpu], ['videos', 'usta videosu', Video], ['documents', 'doküman', FileText],
  ['answered_questions', 'cevaplı soru', MessageCircleQuestion], ['maintenance_records', 'bakım kaydı', Wrench],
];

export function StatsTiles({ stats }: { stats: AdminStats }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {LABELS.map(([k, label, Icon]) => (
        <Card key={k} className="gap-1">
          <Icon className="size-5 text-steel/60" aria-hidden="true" />
          <b className="font-display text-4xl leading-none text-steel">{stats[k]}</b>
          <span className="text-sm text-muted-foreground">{t(label)}</span>
        </Card>
      ))}
    </div>
  );
}
