export interface SearchOption {
  value: string;
  label: string;
  hint?: string; // second line, also searched (e.g. the Turkish name of a language)
  disabled?: boolean;
  lang?: string;
}

/** Lower case, Turkish dotted/dotless i folded, accents dropped: "turkce" finds "Türkçe", "isvecce" "İsveççe". */
export function normalize(text: string): string {
  return text.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/\p{M}/gu, '');
}

/** Options whose label, hint or value contains every word typed. */
export function filterOptions(options: SearchOption[], query: string): SearchOption[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return options;
  return options.filter((o) => {
    const text = normalize(`${o.label} ${o.hint ?? ''} ${o.value}`);
    return words.every((w) => text.includes(w));
  });
}
