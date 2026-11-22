import type { FocusEvent } from 'react';
import type { SearchOption } from './filter';
import { useSearchSelect } from './useSearchSelect';

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
}

/** Drop-down with a search box: type part of a name (accents optional) to narrow a long list such as languages. */
export function SearchSelect({ id, label, value, options, onChange, buttonText, hideLabel, alignEnd }: Props) {
  const { open, query, active, shown, trigger, searchBox, optionId, show, close, pick, search, onKeyDown, setActive } =
    useSearchSelect(id, value, options, onChange);
  const current = options.find((o) => o.value === value);
  const listId = `${id}-list`;

  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget)) close(false);
  }

  return (
    <div className="field searchselect" onBlur={onBlur}>
      <label className={hideLabel ? 'sr-only' : 'label'} htmlFor={id}>{label}</label>
      <button ref={trigger} id={id} type="button" className="searchselect-button" aria-haspopup="listbox" aria-expanded={open} onClick={() => (open ? close(false) : show())}>
        <span lang={current?.lang}>{buttonText ?? current?.label ?? '—'}</span>
      </button>
      {open && (
        <div className={alignEnd ? 'searchselect-panel end' : 'searchselect-panel'}>
          <input
            ref={searchBox}
            role="combobox"
            aria-label={`${label}: ara`}
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={shown.length ? optionId(active) : undefined}
            placeholder="Ara…"
            value={query}
            onChange={(e) => search(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {/* WAI-ARIA combobox pattern: a native <select> can't hold a search box, and the keyboard works through the
              search box (aria-activedescendant), so the options need no key handlers of their own. mousedown keeps
              focus in the search box, so the click still lands on the option. */}
          {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role */}
          <ul role="listbox" id={listId} aria-label={label} onMouseDown={(e) => e.preventDefault()}>
            {shown.map((o, i) => (
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-to-interactive-role
              <li key={o.value} id={optionId(i)} role="option" aria-selected={o.value === value} aria-disabled={o.disabled || undefined} className={i === active ? 'active' : undefined} onMouseEnter={() => setActive(i)} onClick={() => pick(o)}>
                <span lang={o.lang}>{o.label}</span>{' '}
                {o.hint && o.hint !== o.label && <small>{o.hint}</small>}
              </li>
            ))}
            {shown.length === 0 && <li className="empty">Sonuç yok</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
