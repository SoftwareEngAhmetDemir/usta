import { useNavigate } from 'react-router';

/** Screen heading; `back` adds a back button that returns to the previous screen. */
export function PageTitle({ title, back = false }: { title: string; back?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="pagetitle">
      {back && (
        <button type="button" className="back" aria-label="Geri" onClick={() => navigate(-1)}>
          ‹
        </button>
      )}
      <h1>{title}</h1>
    </div>
  );
}
