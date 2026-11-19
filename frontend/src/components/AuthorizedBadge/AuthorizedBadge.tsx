import type { AuthorizedPerson } from '../../api';

/** "Yetkili" badge; opens the authorization document when there is one (KAN-26). */
export function AuthorizedBadge({ person }: { person: AuthorizedPerson }) {
  if (!person.authorized) return null;
  if (!person.authorization_document_url) return <span className="pill ok">Yetkili</span>;
  return (
    <a className="pill ok" href={person.authorization_document_url} target="_blank" rel="noreferrer" title="Yetki belgesini aç">
      Yetkili
    </a>
  );
}
