import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { filterOptions } from './filter';
import type { SearchOption } from './filter';

/** Open/closed, search text and the highlighted option of a SearchSelect, with keyboard handling. */
export function useSearchSelect(id: string, value: string, options: SearchOption[], onChange: (value: string) => void) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const searchBox = useRef<HTMLInputElement>(null);
  const shown = filterOptions(options, query);
  const optionId = (i: number) => `${id}-opt-${i}`;

  useEffect(() => {
    if (open) searchBox.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' });
  });

  function show() {
    setQuery('');
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function close(focusTrigger: boolean) {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus();
  }

  function pick(option: SearchOption | undefined) {
    if (!option || option.disabled) return;
    close(true);
    if (option.value !== value) onChange(option.value);
  }

  function search(text: string) {
    setQuery(text);
    setActive(0);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 };
    if (e.key in moves) {
      e.preventDefault();
      setActive((a) => Math.min(shown.length - 1, Math.max(0, a + (moves[e.key] ?? 0))));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(shown[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    }
  }

  return { open, query, active, shown, trigger, searchBox, optionId, show, close, pick, search, onKeyDown, setActive };
}
