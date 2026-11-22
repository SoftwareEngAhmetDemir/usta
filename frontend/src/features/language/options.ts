import type { Language } from '../../api';
import type { SearchOption } from '../../components/SearchSelect';

/** A language as a drop-down option: native name, Turkish name as the searchable hint. */
export const languageOption = (l: Language): SearchOption => ({ value: l.code, label: l.name, hint: l.tr_name, lang: l.code });
