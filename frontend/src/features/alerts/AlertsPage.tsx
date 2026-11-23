import { PageTitle } from '../../components/PageTitle';
import { AlertList } from './components/AlertList';
import { useAlerts } from './hooks/useAlerts';
import { useT } from '../../i18n';

export function AlertsPage() {
  const t = useT();
  const { list, open } = useAlerts();
  return (
    <>
      <PageTitle title={t('Bildirimler')} back />
      <AlertList items={list.items} onOpen={open} />
    </>
  );
}
