import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { ApiError, request, useAction } from '../../api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useMe } from '../auth';
import { newMachineState } from '../machine-new';
import { CodeForm } from './components/CodeForm';
import { NotFoundDialog } from './components/NotFoundDialog';
import { QrScanner } from './components/QrScanner';
import { useT } from '../../i18n';

const lookup = (code: string) => request<{ id: number }>(`/machines/lookup?code=${encodeURIComponent(code)}`);

/** 404 = no machine has this code; 422 = the QR text is no machine code at all (e.g. a long foreign URL). */
const noMachine = (e: unknown) => e instanceof ApiError && (e.status === 404 || e.status === 422);

/** Worker home. Reads the QR in the page (or the phone's own camera opens its URL), or takes a typed code (KAN-29).
 * An unknown one: workers see "not found"; ustas and the patron are offered to add a machine with it (KAN-27). */
export function ScanPage() {
  const t = useT();
  const me = useMe();
  const navigate = useNavigate();
  const find = useAction(lookup);
  const [tried, setTried] = useState({ code: '', typed: false });
  const missing = noMachine(find.error);
  // 422: longer than any QR a machine can keep, so there is nothing to add it with
  const canAdd = me.can_add_machines && find.error instanceof ApiError && find.error.status === 404;

  async function open(code: string, typed = false) {
    setTried({ code, typed });
    const m = await find.run(code);
    if (m) navigate(`/m/${m.id}`);
  }

  return (
    <>
      <QrScanner onCode={open} paused={find.pending || missing} />
      <CodeForm pending={find.pending} onSubmit={(code) => void open(code, true)} />
      <ErrorMessage error={missing ? null : find.error} />
      <NotFoundDialog
        code={missing ? tried.code : null}
        typed={tried.typed}
        onAdd={canAdd ? () => navigate('/machines/new', { state: newMachineState(tried) }) : undefined}
        onClose={find.reset}
      />
      <Button asChild variant="secondary"><Link to="/my-questions"><ClipboardList aria-hidden="true" />{t('Sorularım')}</Link></Button>
    </>
  );
}
