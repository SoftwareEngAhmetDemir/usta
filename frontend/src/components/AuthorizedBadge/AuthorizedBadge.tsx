import type { AuthorizedPerson } from '../../api';
import { useT } from '../../i18n';

/** "Yetkili" badge; opens the authorization document when there is one (KAN-26). */
export function AuthorizedBadge({ person }: { person: AuthorizedPerson }) {
  const t = useT();
  if (!person.authorized) return null;
  if (!person.authorization_document_url) return <span className="pill ok">{t('Yetkili')}</span>;
  return (
    <a className="pill ok" href={person.authorization_document_url} target="_blank" rel="noreferrer" title={t('Yetki belgesini aç')}>
      {t('Yetkili')}
    </a>
  );
}
