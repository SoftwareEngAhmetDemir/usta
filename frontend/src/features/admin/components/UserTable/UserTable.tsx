import type { AdminUser } from '../../../../api';
import { ROLE_LABEL } from '../../../auth';
import { useT } from '../../../../i18n';

export function UserTable({ users }: { users: AdminUser[] }) {
  const t = useT();
  return (
    <div className="tablewrap">
      <table>
        <thead><tr><th>{t('Ad')}</th><th>{t('Rol')}</th><th>{t('Yetki')}</th><th>{t('Makineler')}</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td><b>{u.name}</b></td>
              <td>{t(ROLE_LABEL[u.role])}</td>
              <td>
                {u.authorized ? (
                  <>
                    <span className="pill ok">{t('Yetkili')}</span> <span className="muted">{u.authorization_note}</span>
                    {u.authorization_document_url && <> · <a href={u.authorization_document_url} target="_blank" rel="noreferrer">{t('Belge')}</a></>}
                  </>
                ) : <span className="muted">—</span>}
              </td>
              <td>{u.machines.length ? u.machines.map((m) => m.name).join(', ') : <span className="muted">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
