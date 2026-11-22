import { useState } from 'react';
import type { AdminMachineList } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { Button } from '../../components/Button';
import { PageTitle } from '../../components/PageTitle';
import { stickerPdfUrl } from './api';
import { AdminTabs } from './components/AdminTabs';
import { StickerSheet } from './components/StickerSheet';

/** Printable QR sticker sheet for the ticked machines; the backend also renders it as one PDF (KAN-30). */
export function StickersPage() {
  const { state, reload } = useApi<AdminMachineList>('/admin/machines?q=');
  const [excluded, setExcluded] = useState<ReadonlySet<number>>(new Set());
  const toggle = (id: number) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  return (
    <>
      <PageTitle title="QR etiketleri" />
      <AdminTabs />
      <AsyncView state={state} onRetry={reload}>
        {(data) => {
          const picked = data.machines.filter((m) => !excluded.has(m.id)).map((m) => m.id);
          return (
            <>
              <div className="row wrap no-print">
                {picked.length === 0 ? (
                  <span className="muted">Yazdırmak için en az bir makine seçin.</span>
                ) : (
                  <>
                    <a className="btn" data-size="small" href={stickerPdfUrl(excluded.size ? picked : undefined)} download>
                      PDF indir ({picked.length})
                    </a>
                    <Button variant="secondary" size="small" onClick={() => window.print()}>Yazdır</Button>
                  </>
                )}
              </div>
              <StickerSheet machines={data.machines} excluded={excluded} onToggle={toggle} />
            </>
          );
        }}
      </AsyncView>
    </>
  );
}
