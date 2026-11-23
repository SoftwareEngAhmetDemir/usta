import { Download, Printer } from 'lucide-react';
import { useState } from 'react';
import type { AdminMachineList } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { Button } from '../../components/Button';
import { PageTitle } from '../../components/PageTitle';
import { stickerPdfUrl } from './api';
import { AdminTabs } from './components/AdminTabs';
import { StickerSheet } from './components/StickerSheet';
import { useT } from '../../i18n';

/** Printable QR sticker sheet for the ticked machines; the backend also renders it as one PDF (KAN-30). */
export function StickersPage() {
  const t = useT();
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
      <PageTitle title={t('QR etiketleri')} />
      <AdminTabs />
      <AsyncView state={state} onRetry={reload}>
        {(data) => {
          const picked = data.machines.filter((m) => !excluded.has(m.id)).map((m) => m.id);
          return (
            <>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                {picked.length === 0 ? (
                  <span className="text-sm text-muted-foreground">{t('Yazdırmak için en az bir makine seçin.')}</span>
                ) : (
                  <>
                    <Button asChild size="small">
                      <a href={stickerPdfUrl(excluded.size ? picked : undefined)} download><Download aria-hidden="true" />{t('PDF indir (')}{picked.length})</a>
                    </Button>
                    <Button variant="secondary" size="small" onClick={() => window.print()}><Printer aria-hidden="true" />{t('Yazdır')}</Button>
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
