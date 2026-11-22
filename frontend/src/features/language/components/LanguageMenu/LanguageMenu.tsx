import type { Language, LanguageCode } from '../../../../api';
import { SearchSelect } from '../../../../components/SearchSelect';
import { languageOption } from '../../options';

interface Props {
  languages: Language[];
  current: LanguageCode;
  onChoose: (code: LanguageCode) => void;
}

/** Header menu: the language the whole site shows its content in (videos, documents, questions, answers). */
export function LanguageMenu({ languages, current, onChoose }: Props) {
  if (languages.length === 0) return null;
  return (
    <SearchSelect
      id="site-language"
      label="Site dili"
      hideLabel
      alignEnd
      value={current}
      buttonText={`🌐 ${current.toUpperCase()}`}
      options={languages.map(languageOption)}
      onChange={onChoose}
    />
  );
}
