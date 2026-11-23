import { useNavigate } from 'react-router';
import { useT } from '../../i18n';

/** Screen heading; `back` adds a back button that returns to the previous screen. */
export function PageTitle({ title, back = false }: { title: string; back?: boolean }) {
  const t = useT();
  const navigate = useNavigate();
  return (
    <div className="pagetitle">
      {back && (
        <button type="button" className="back" aria-label={t('Geri')} onClick={() => navigate(-1)}>
          ‹
        </button>
      )}
      <h1>{title}</h1>
    </div>
  );
}
