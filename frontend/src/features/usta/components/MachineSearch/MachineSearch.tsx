import { Search } from 'lucide-react';
import { Link } from 'react-router';
import type { ApiState, MachineHit } from '../../../../api';
import { AsyncView } from '../../../../components/AsyncView';
import { Chip } from '../../../../components/Chip';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
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
    <Card>
      <Label htmlFor="machine-q" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t('Makine ara')}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input id="machine-q" type="search" className="ps-9" placeholder={t('Kod, ad veya konum…')} value={query} onChange={(e) => onQueryChange(e.target.value)} />
      </div>
      <AsyncView state={results} onRetry={onRetry}>
        {(hits) =>
          hits.length === 0 ? (
            <p className="m-0 text-sm text-muted-foreground">{t('Bu aramayla makine bulunamadı.')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {hits.map((m) => (
                <Chip key={m.id} asChild>
                  <Link to={`/m/${m.id}`}><b className="shrink-0 font-mono text-xs text-steel">{m.code}</b>{' · '}{m.name}{m.location ? ` · ${m.location}` : ''}</Link>
                </Chip>
              ))}
            </div>
          )
        }
      </AsyncView>
    </Card>
  );
}
