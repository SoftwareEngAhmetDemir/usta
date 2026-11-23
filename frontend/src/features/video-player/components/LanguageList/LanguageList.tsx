import { Check, ChevronLeft, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SearchOption } from '../../../../components/SearchSelect';
import { filterOptions } from '../../../../components/SearchSelect';
import { useT } from '../../../../i18n';

interface Props {
  title: string;
  options: SearchOption[];
  value: string;
  onPick: (value: string) => void;
  onBack: () => void;
}

/** Second level of the player settings: a searchable language list (type part of a name, accents optional). */
export function LanguageList({ title, options, value, onPick, onBack }: Props) {
  const t = useT();
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => search.current?.focus(), []); // the list opens to type straight away
  const shown = filterOptions(options, query);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-md px-1 py-1 text-start font-semibold hover:bg-white/10">
        <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden="true" />{title}
      </button>
      <div className="relative">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-white/50" aria-hidden="true" />
        <input
          ref={search}
          aria-label={`${title}: ${t('ara')}`}
          placeholder={t('Ara…')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full rounded-md border border-white/20 bg-white/10 ps-8 pe-2 text-sm text-white outline-none placeholder:text-white/50 focus-visible:border-primary"
        />
      </div>
      <ul className="m-0 max-h-60 list-none overflow-y-auto p-0" aria-label={title}>
        {shown.map((o) => (
          <li key={o.value}>
            <button
              type="button"
              disabled={o.disabled}
              aria-current={o.value === value || undefined}
              onClick={() => onPick(o.value)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/45 aria-current:font-semibold"
            >
              <Check className={o.value === value ? 'size-4 shrink-0 text-primary' : 'size-4 shrink-0 opacity-0'} aria-hidden="true" />
              <span lang={o.lang} className="flex-1">{o.label}</span>
              {o.hint && o.hint !== o.label && <small className="text-xs text-white/50">{o.hint}</small>}
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="px-2 py-2 text-sm text-white/50">{t('Sonuç yok')}</li>}
      </ul>
    </div>
  );
}
