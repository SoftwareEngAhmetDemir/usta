import { Link, useNavigate } from 'react-router';
import { request, useAction } from '../../api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { CodeForm } from './components/CodeForm';
import { QrScanner } from './components/QrScanner';
import { useT } from '../../i18n';

const lookup = (code: string) => request<{ id: number }>(`/machines/lookup?code=${encodeURIComponent(code)}`);

/** Worker home. Reads the QR in the page (or the phone's own camera opens its URL), or takes a typed code (KAN-29). */
export function ScanPage() {
  const t = useT();
  const navigate = useNavigate();
  const find = useAction(lookup);

  async function open(code: string) {
    const m = await find.run(code);
    if (m) navigate(`/m/${m.id}`);
  }

  return (
    <>
      <QrScanner onCode={open} />
      <CodeForm pending={find.pending} onSubmit={open} />
      <ErrorMessage error={find.error} />
      <Link className="btn" data-variant="secondary" to="/my-questions">{t('Sorularım')}</Link>
    </>
  );
}
