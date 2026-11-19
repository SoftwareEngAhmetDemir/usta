import type { AdminMachineList } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { Button } from '../../components/Button';
import { PageTitle } from '../../components/PageTitle';
import { stickerPdfUrl } from './api';
import { AdminTabs } from './components/AdminTabs';
import { StickerSheet } from './components/StickerSheet';

/** Printable QR sticker sheet; the backend also renders it as one PDF (KAN-30). */
export function StickersPage() {
  const { state, reload } = useApi<AdminMachineList>('/admin/machines?q=');
  return (
    <>
      <PageTitle title="QR etiketleri" />
      <AdminTabs />
      <div className="row wrap no-print">
        <a className="btn" data-size="small" href={stickerPdfUrl} download>PDF indir</a>
        <Button variant="secondary" size="small" onClick={() => window.print()}>Yazdır</Button>
      </div>
      <AsyncView state={state} onRetry={reload}>{(data) => <StickerSheet machines={data.machines} />}</AsyncView>
    </>
  );
}
