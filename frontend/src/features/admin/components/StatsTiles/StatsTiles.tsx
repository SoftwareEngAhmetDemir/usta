import type { AdminStats } from '../../../../api';
import { useT } from '../../../../i18n';

const LABELS: [keyof AdminStats, string][] = [
  ['machines', 'makine'], ['videos', 'usta videosu'], ['documents', 'doküman'], ['answered_questions', 'cevaplı soru'], ['maintenance_records', 'bakım kaydı'],
];

export function StatsTiles({ stats }: { stats: AdminStats }) {
  const t = useT();
  return (
    <div className="tiles">
      {LABELS.map(([k, label]) => <div key={k} className="tile"><b>{stats[k]}</b>{t(label)}</div>)}
    </div>
  );
}
