import type { Language, LanguageCode } from '../../../../api';
import { SearchSelect } from '../../../../components/SearchSelect';
import { languageOption } from '../../options';
import { useT } from '../../../../i18n';

interface Props {
  languages: Language[];
  current: LanguageCode;
  onChoose: (code: LanguageCode) => void;
}

/** Header menu: the language the whole site shows its content in (videos, documents, questions, answers). */
export function LanguageMenu({ languages, current, onChoose }: Props) {
  const t = useT();
  if (languages.length === 0) return null;
  return (
    <SearchSelect
      id="site-language"
      label={t('Site dili')}
      hideLabel
      alignEnd
      value={current}
      variant="header"
      buttonText={`🌐 ${current.toUpperCase()}`}
      options={languages.map(languageOption)}
      onChange={onChoose}
    />
  );
}
