import type { Language, LanguageCode } from '../../../../api';

interface Props {
  languages: Language[];
  current: LanguageCode;
  onChoose: (code: LanguageCode) => void;
}

/** Content language switch. The app UI stays Turkish; only content changes. */
export function LanguageBar({ languages, current, onChoose }: Props) {
  if (languages.length === 0) return null;
  return (
    <fieldset className="langbar">
      <legend className="label">İçerik dili</legend>
      <div className="chips">
        {languages.map((l) => (
          <button key={l.code} type="button" className="chip" lang={l.code} dir={l.dir} aria-pressed={l.code === current} onClick={() => onChoose(l.code)}>
            {l.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
