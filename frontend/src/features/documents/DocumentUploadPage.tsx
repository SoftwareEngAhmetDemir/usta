import { useNavigate, useParams } from 'react-router';
import type { MachinePage } from '../../api';
import { useApi } from '../../api';
import { AsyncView } from '../../components/AsyncView';
import { PageTitle } from '../../components/PageTitle';
import { DocumentUploadForm, uploadDocument, useFormSubmit } from '../admin';

/** "Belge yükle" from the machine page: the machine's ustas and the patron add a manual, catalog… (KAN-33). */
export function DocumentUploadPage() {
  const { machineId = '' } = useParams();
  const navigate = useNavigate();
  const { state, reload } = useApi<MachinePage>(`/machines/${machineId}`);
  const send = useFormSubmit(uploadDocument);

  return (
    <>
      <PageTitle title="Belge yükle" back />
      <AsyncView state={state} onRetry={reload}>
        {({ machine, actions }) =>
          actions.upload_document ? (
            <DocumentUploadForm
              machines={[machine]}
              defaultMachineId={machine.id}
              state={send.state}
              onSubmit={(body) => void send.submit(body).then((ok) => { if (ok) navigate(`/m/${machine.id}`); })}
            />
          ) : (
            <div className="alert-error" role="alert">Bu makineye belge yükleme yetkiniz yok. Makinenin ustası veya patron yükleyebilir.</div>
          )
        }
      </AsyncView>
    </>
  );
}
