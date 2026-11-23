import { Check, ChevronDown, Search } from 'lucide-react';
import type { FocusEvent } from 'react';
import { cn } from 'cn';
import type { SearchOption } from './filter';
import { useSearchSelect } from './useSearchSelect';
import { useT } from '../../i18n';

interface Props {
  id: string;
  label: string;
  value: string;
  options: SearchOption[];
  onChange: (value: string) => void;
  /** Text on the closed button (default: the chosen option's label). */
  buttonText?: string;
  /** Label read by screen readers only (e.g. in the header). */
  hideLabel?: boolean;
  /** Open the list towards the left edge of the button (for controls at the right of the screen). */
  alignEnd?: boolean;
  /** `header`: light-on-steel button for the app header. */
  variant?: 'field' | 'header';
}

/** Drop-down with a search box: type part of a name (accents optional) to narrow a long list such as languages. */
export function SearchSelect({ id, label, value, options, onChange, buttonText, hideLabel, alignEnd, variant = 'field' }: Props) {
  const t = useT();
  const { open, query, active, shown, trigger, searchBox, optionId, show, close, pick, search, onKeyDown, setActive } =
    useSearchSelect(id, value, options, onChange);
  const current = options.find((o) => o.value === value);
  const listId = `${id}-list`;

  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) close(false);
  }

  return (
    <div className="relative flex flex-col gap-1.5" onBlur={onBlur}>
      <label className={hideLabel ? 'sr-only' : 'text-xs font-semibold tracking-wide text-muted-foreground uppercase'} htmlFor={id}>{label}</label>
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close(false) : show())}
        className={cn(
          'flex w-full items-center justify-between gap-2 text-start transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
          variant === 'field'
            ? 'h-11 rounded-md border border-input bg-card px-3 shadow-xs hover:bg-muted/50'
            : 'h-10 rounded-lg bg-white/12 px-2.5 text-sm font-medium text-white hover:bg-white/20',
        )}
      >
        <span lang={current?.lang} className="truncate">{buttonText ?? current?.label ?? '—'}</span>
        <ChevronDown className={cn('size-4 shrink-0', variant === 'field' ? 'text-muted-foreground' : 'text-white/70')} aria-hidden="true" />
      </button>
      {open && (
        <div
          className={cn(
            'absolute top-full z-30 mt-1.5 w-[max(100%,260px)] max-w-[92vw] rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95',
            alignEnd ? 'end-0' : 'start-0',
          )}
        >
          <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            className="h-10 w-full rounded-md border border-input bg-transparent ps-8 pe-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            ref={searchBox}
            role="combobox"
            aria-label={`${label}: ${t('ara')}`}
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={shown.length ? optionId(active) : undefined}
            placeholder={t('Ara…')}
            value={query}
            onChange={(e) => search(e.target.value)}
            onKeyDown={onKeyDown}
          />
          </div>
          {/* WAI-ARIA combobox pattern: a native <select> can't hold a search box, and the keyboard works through the
              search box (aria-activedescendant), so the options need no key handlers of their own. mousedown keeps
              focus in the search box, so the click still lands on the option. */}
          {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role */}
          <ul role="listbox" id={listId} aria-label={label} className="m-0 mt-1.5 max-h-[min(50vh,320px)] list-none overflow-y-auto p-0" onMouseDown={(e) => e.preventDefault()}>
            {shown.map((o, i) => (
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-to-interactive-role
              <li key={o.value} id={optionId(i)} role="option" aria-selected={o.value === value} aria-disabled={o.disabled || undefined} data-active={i === active || undefined} onMouseEnter={() => setActive(i)} onClick={() => pick(o)}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm data-active:bg-muted aria-disabled:cursor-not-allowed aria-disabled:text-muted-foreground aria-selected:font-semibold aria-selected:text-steel">
                <Check className={cn('size-4 shrink-0', o.value === value ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                <span lang={o.lang} className="flex-1">{o.label}</span>{' '}
                {o.hint && o.hint !== o.label && <small className="text-xs text-muted-foreground">{o.hint}</small>}
              </li>
            ))}
            {shown.length === 0 && <li className="px-2.5 py-2 text-sm text-muted-foreground">{t('Sonuç yok')}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
