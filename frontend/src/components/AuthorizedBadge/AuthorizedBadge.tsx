import { ShieldCheck } from 'lucide-react';
import type { AuthorizedPerson } from '../../api';
import { useT } from '../../i18n';
import { Badge } from '../ui/badge';
import { TONE_CLASS } from '../Pill';

/** "Yetkili" badge; opens the authorization document when there is one (KAN-26). */
export function AuthorizedBadge({ person }: { person: AuthorizedPerson }) {
  const t = useT();
  if (!person.authorized) return null;
  const content = <><ShieldCheck aria-hidden="true" />{t('Yetkili')}</>;
  if (!person.authorization_document_url) return <Badge data-tone="ok" className={TONE_CLASS.ok}>{content}</Badge>;
  return (
    <Badge asChild data-tone="ok" className={`${TONE_CLASS.ok} underline-offset-2 hover:underline`}>
      <a href={person.authorization_document_url} target="_blank" rel="noreferrer" title={t('Yetki belgesini aç')}>{content}</a>
    </Badge>
  );
}
