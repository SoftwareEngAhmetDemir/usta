import type { LocalizedText } from '../../api';

/** Content text with its language and direction (Arabic renders right-to-left). */
export function Localized({ value, as: Tag = 'span' }: { value: LocalizedText; as?: 'span' | 'p' | 'div' }) {
  return <Tag lang={value.lang} dir={value.dir}>{value.text}</Tag>;
}
