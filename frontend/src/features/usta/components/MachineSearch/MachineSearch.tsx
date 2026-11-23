import { Link } from 'react-router';
import type { ApiState, MachineHit } from '../../../../api';
import { AsyncView } from '../../../../components/AsyncView';
import { EmptyState } from '../../../../components/EmptyState';
import { useT } from '../../../../i18n';

interface MachineSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  results: ApiState<MachineHit[]>;
  onRetry: () => void;
}

/** Find any machine (the backend searches code, name, serial and location) and open its page. */
export function MachineSearch({ query, onQueryChange, results, onRetry }: MachineSearchProps) {
  const t = useT();
  return (
    <div className="card stack">
      <div className="field">
        <label htmlFor="machine-q">{t('Makine ara')}</label>
        <input id="machine-q" type="search" placeholder={t('Kod, ad veya konum…')} value={query} onChange={(e) => onQueryChange(e.target.value)} />
      </div>
      <AsyncView state={results} onRetry={onRetry}>
        {(hits) =>
          hits.length === 0 ? (
            <EmptyState message={t('Bu aramayla makine bulunamadı.')} />
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
