import { Link, useNavigate } from 'react-router';
import { request, useAction } from '../../api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { CodeForm } from './components/CodeForm';

const lookup = (code: string) => request<{ id: number }>(`/machines/lookup?code=${encodeURIComponent(code)}`);

/** Worker home. The QR holds the machine page URL, so the phone camera opens it directly (KAN-29). */
export function ScanPage() {
  const navigate = useNavigate();
  const find = useAction(lookup);

  async function open(code: string) {
    const m = await find.run(code);
    if (m) navigate(`/m/${m.id}`);
  }

  return (
    <>
      <div className="scanner">
        <div className="viewfinder" aria-hidden="true">⌁</div>
        <div><b>Makinedeki QR'ı telefon kamerasıyla okutun</b><br /><span style={{ opacity: 0.75, fontSize: 14 }}>Uygulama kurmaya gerek yok; makine sayfası açılır.</span></div>
      </div>
      <CodeForm pending={find.pending} onSubmit={open} />
      <ErrorMessage error={find.error} />
      <Link className="btn" data-variant="secondary" to="/my-questions">Sorularım</Link>
    </>
  );
}
