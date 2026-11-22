import { Link } from 'react-router';
import type { ApiState, MachineHit } from '../../../../api';
import { AsyncView } from '../../../../components/AsyncView';
import { EmptyState } from '../../../../components/EmptyState';

interface MachineSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  results: ApiState<MachineHit[]>;
  onRetry: () => void;
}

/** Find any machine (the backend searches code, name, serial and location) and open its page. */
export function MachineSearch({ query, onQueryChange, results, onRetry }: MachineSearchProps) {
  return (
    <div className="card stack">
      <div className="field">
        <label htmlFor="machine-q">Makine ara</label>
        <input id="machine-q" type="search" placeholder="Kod, ad veya konum…" value={query} onChange={(e) => onQueryChange(e.target.value)} />
      </div>
      <AsyncView state={results} onRetry={onRetry}>
        {(hits) =>
          hits.length === 0 ? (
            <EmptyState message="Bu aramayla makine bulunamadı." />
          ) : (
            <div className="chips">
              {hits.map((m) => (
                <Link key={m.id} className="chip" to={`/m/${m.id}`}>
                  {m.code} · {m.name}{m.location ? ` · ${m.location}` : ''}
                </Link>
              ))}
            </div>
          )
        }
      </AsyncView>
    </div>
  );
}
