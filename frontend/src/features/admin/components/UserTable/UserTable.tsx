import type { AdminUser } from '../../../../api';
import { ROLE_LABEL } from '../../../auth';

export function UserTable({ users }: { users: AdminUser[] }) {
  return (
    <div className="tablewrap">
      <table>
        <thead><tr><th>Ad</th><th>Rol</th><th>Yetki</th><th>Makineler</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td><b>{u.name}</b></td>
              <td>{ROLE_LABEL[u.role]}</td>
              <td>
                {u.authorized ? (
                  <>
                    <span className="pill ok">Yetkili</span> <span className="muted">{u.authorization_note}</span>
                    {u.authorization_document_url && <> · <a href={u.authorization_document_url} target="_blank" rel="noreferrer">Belge</a></>}
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
