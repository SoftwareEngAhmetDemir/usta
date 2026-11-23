import type { AdminUser } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { PageTitle } from '../../components/PageTitle';
import { AdminTabs } from './components/AdminTabs';
import { UserTable } from './components/UserTable';
import { useT } from '../../i18n';

/** Users, roles and authorized status. Editing (roles, passwords, usta links) is in SQLAdmin (KAN-41). */
export function UsersPage() {
  const t = useT();
  const { state, reload } = useApi<AdminUser[]>('/admin/users');
  return (
    <>
      <PageTitle title={t('Kullanıcılar ve roller')} />
      <AdminTabs />
      <AsyncView state={state} onRetry={reload}>{(users) => <UserTable users={users} />}</AsyncView>
    </>
  );
}
