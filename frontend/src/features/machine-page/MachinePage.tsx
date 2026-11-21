import { Link, useLocation, useNavigate, useParams } from 'react-router';
import type { MachinePage as MachinePageData } from '../../api';
import { useAction, useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageTitle } from '../../components/PageTitle';
import { archiveMachine } from './api';
import { ArchiveMachine } from './components/ArchiveMachine';
import { DocumentList } from './components/DocumentList';
import { LanguageBar } from './components/LanguageBar';
import { MachineHeader } from './components/MachineHeader';
import { MaintenanceSection } from './components/MaintenanceSection';
import { QaSection } from './components/QaSection';
import { UstaList } from './components/UstaList';
import { VideoList } from './components/VideoList';
import { useLanguageSwitch } from './hooks/useLanguageSwitch';

function highlightFrom(state: unknown): number | undefined {
  if (state && typeof state === 'object' && 'highlight' in state && typeof state.highlight === 'number') return state.highlight;
  return undefined;
}

/** Everything about one machine on one screen, opened from its QR (KAN-31, KAN-71). */
export function MachinePage() {
  const { machineId = '' } = useParams();
  const highlight = highlightFrom(useLocation().state);
  const { state, reload } = useApi<MachinePageData>(`/machines/${machineId}`);
  const lang = useLanguageSwitch(reload);
  const languageName = lang.languages.find((l) => l.code === lang.current)?.name ?? lang.current;
  const navigate = useNavigate();
  const archive = useAction(archiveMachine);
  const remove = async (id: number) => { if (await archive.run(id)) navigate('/', { replace: true }); };

  return (
    <>
      <PageTitle title="Makine" />
      <AsyncView state={state} onRetry={reload}>
        {(page) => (
          <>
            <MachineHeader machine={page.machine} />
            <UstaList ustas={page.ustas} />
            <LanguageBar languages={lang.languages} current={lang.current} onChoose={lang.choose} />
            <ErrorMessage error={lang.error} />
            {page.actions.ask && (
              <Link className="cta" to={`/m/${page.machine.id}/ask`}>
                <span className="ic" aria-hidden="true">?</span>
                <span className="grow"><b>Makineye sor</b><small>Cevap videolardan ve dokümanlardan, kaynağıyla gelir</small></span>
              </Link>
            )}
            <VideoList machineId={page.machine.id} videos={page.videos} external={page.external_videos} languageName={languageName} canRecord={page.actions.record_video} />
            <DocumentList machineId={page.machine.id} documents={page.documents} canUpload={page.actions.upload_document} />
            <MaintenanceSection machineId={page.machine.id} records={page.maintenance} canRecord={page.actions.record_maintenance} highlightId={highlight} />
            <QaSection questions={page.questions} />
            {page.actions.archive && <ArchiveMachine pending={archive.pending} error={archive.error} onConfirm={() => void remove(page.machine.id)} />}
          </>
        )}
      </AsyncView>
    </>
  );
}
