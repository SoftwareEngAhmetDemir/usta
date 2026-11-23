import { useUiLoading } from '../../../i18n';

/** While the UI is being translated: a sliding bar under the header and the language's own name with a spinner
 * (written in that language, since the UI texts are not there yet). */
export function LanguageLoading({ languageName }: { languageName: string }) {
  if (!useUiLoading()) return null;
  return (
    <output className="lang-loading">
      <span className="lang-loading-bar" aria-hidden="true" />
      <span className="lang-loading-chip">
        <span className="spinner small" aria-hidden="true" />
        {languageName}…
      </span>
    </output>
  );
}
