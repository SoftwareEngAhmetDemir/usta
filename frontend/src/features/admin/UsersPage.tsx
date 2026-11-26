import { useSearchParams } from 'react-router';
import type { AdminUser } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { EmptyState } from '../../components/EmptyState';
import { PageTitle } from '../../components/PageTitle';
import { AdminTabs } from './components/AdminTabs';
import { RoleTabs, TAB_ROLES, type TabRole } from './components/RoleTabs';
import { UserTable } from './components/UserTable';
import { useT } from '../../i18n';

const isTabRole = (value: string | null): value is TabRole => TAB_ROLES.some((r) => r === value);

/** Users by role: İşçi (default), Usta, Patron tabs; `?role=` keeps the choice on back. Editing (roles, passwords, usta links) is in SQLAdmin (KAN-41). */
export function UsersPage() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const raw = params.get('role');
  const role = isTabRole(raw) ? raw : 'worker';
  const { state, reload } = useApi<AdminUser[]>(`/admin/users?role=${role}`);
  return (
    <>
      <PageTitle title={t('Kullanıcılar ve roller')} />
      <AdminTabs />
      <RoleTabs value={role} onChange={(next) => setParams({ role: next }, { replace: true })} />
      <AsyncView state={state} onRetry={reload}>
        {(users) => (users.length ? <UserTable users={users} /> : <EmptyState message={t('Bu rolde kullanıcı yok.')} />)}
      </AsyncView>
    </>
  );
}
