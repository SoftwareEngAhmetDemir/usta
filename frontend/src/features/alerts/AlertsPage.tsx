import { PageTitle } from '../../components/PageTitle';
import { AlertList } from './components/AlertList';
import { useAlerts } from './hooks/useAlerts';

export function AlertsPage() {
  const { list, open } = useAlerts();
  return (
    <>
      <PageTitle title="Bildirimler" back />
      <AlertList items={list.items} onOpen={open} />
    </>
  );
}
