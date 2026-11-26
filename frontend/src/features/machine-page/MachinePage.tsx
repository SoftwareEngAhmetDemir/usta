import { MessageCircleQuestion } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import type { MachinePage as MachinePageData } from '../../api';
import { useAction, useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { CtaLink } from '../../components/CtaLink';
import { PageTitle } from '../../components/PageTitle';
import { archiveMachine } from './api';
import { ArchiveMachine } from './components/ArchiveMachine';
import { DeleteContentDialog } from './components/DeleteContentDialog';
import { DocumentList } from './components/DocumentList';
import { MachineHeader } from './components/MachineHeader';
import { MachineQr } from './components/MachineQr';
import { MaintenanceSection } from './components/MaintenanceSection';
import { QaSection } from './components/QaSection';
import { UstaList } from './components/UstaList';
import { VideoList } from './components/VideoList';
import { useDeleteContent } from './hooks/useDeleteContent';
import { useMe } from '../auth';
import { useT } from '../../i18n';

function highlightFrom(state: unknown): number | undefined {
  if (state && typeof state === 'object' && 'highlight' in state && typeof state.highlight === 'number') return state.highlight;
  return undefined;
}

/** Everything about one machine on one screen, opened from its QR (KAN-31, KAN-71). */
export function MachinePage() {
  const t = useT();
  const { machineId = '' } = useParams();
  const highlight = highlightFrom(useLocation().state);
  const { state, reload } = useApi<MachinePageData>(`/machines/${machineId}`);
  const languageName = useMe().language_name;
  const navigate = useNavigate();
  const archive = useAction(archiveMachine);
  const del = useDeleteContent(reload);
  const remove = async (id: number) => { if (await archive.run(id)) navigate('/', { replace: true }); };

  return (
    <>
      <PageTitle title={t('Makine')} />
      <AsyncView state={state} onRetry={reload}>
        {(page) => (
          <>
            <MachineHeader machine={page.machine} />
            <UstaList ustas={page.ustas} />
            {page.actions.ask && (
              <CtaLink to={`/m/${page.machine.id}/ask`} icon={MessageCircleQuestion} title={t('Makineye sor')} hint={t('Cevap videolardan ve dokümanlardan, kaynağıyla gelir')} />
            )}
            <VideoList machineId={page.machine.id} videos={page.videos} external={page.external_videos} languageName={languageName} canRecord={page.actions.record_video} onDelete={page.actions.delete_content ? (v) => del.ask({ kind: 'videos', id: v.id, title: v.title }) : undefined} />
            <DocumentList machineId={page.machine.id} documents={page.documents} canUpload={page.actions.upload_document} onDelete={page.actions.delete_content ? (d) => del.ask({ kind: 'documents', id: d.id, title: d.title }) : undefined} />
            <MaintenanceSection machineId={page.machine.id} records={page.maintenance} canRecord={page.actions.record_maintenance} highlightId={highlight} />
            <QaSection questions={page.questions} />
            {page.actions.qr && <MachineQr machineId={page.machine.id} name={page.machine.name} />}
            <DeleteContentDialog open={del.open} target={del.target} pending={del.pending} error={del.error} onConfirm={() => void del.confirm()} onClose={del.cancel} />
            {page.actions.archive && <ArchiveMachine pending={archive.pending} error={archive.error} onConfirm={() => void remove(page.machine.id)} />}
          </>
        )}
      </AsyncView>
    </>
  );
}
