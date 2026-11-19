import type { AdminStats } from '../../../../api';

const LABELS: [keyof AdminStats, string][] = [
  ['machines', 'makine'], ['videos', 'usta videosu'], ['documents', 'doküman'], ['answered_questions', 'cevaplı soru'], ['maintenance_records', 'bakım kaydı'],
];

export function StatsTiles({ stats }: { stats: AdminStats }) {
  return (
    <div className="tiles">
      {LABELS.map(([k, label]) => <div key={k} className="tile"><b>{stats[k]}</b>{label}</div>)}
    </div>
  );
}
