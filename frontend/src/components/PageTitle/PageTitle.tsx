import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useT } from '../../i18n';
import { Button } from '../ui/button';

/** Screen heading; `back` adds a back button that returns to the previous screen. */
export function PageTitle({ title, back = false }: { title: string; back?: boolean }) {
  const t = useT();
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3">
      {back && (
        <Button variant="outline" size="icon-lg" className="shrink-0 rounded-lg text-steel" aria-label={t('Geri')} onClick={() => navigate(-1)}>
          <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden="true" />
        </Button>
      )}
      <h1 className="m-0 flex-1 font-display text-3xl leading-none font-semibold tracking-wide text-steel uppercase">{title}</h1>
    </div>
  );
}
