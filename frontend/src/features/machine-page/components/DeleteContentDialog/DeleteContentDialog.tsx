import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { ErrorMessage } from '../../../../components/ErrorMessage';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { useT } from '../../../../i18n';
import type { DeleteTarget } from '../../hooks/useDeleteContent';

interface Props {
  open: boolean;
  target: DeleteTarget | null; // kept after closing, so the text stays while the dialog fades out
  pending: boolean;
  error: unknown;
  onConfirm: () => void;
  onClose: () => void;
}

const TEXT = {
  videos: { title: 'Video silinsin mi?', body: 'Video, altyazıları, dublajları ve "Makineye sor" içindeki yeri kalıcı olarak silinir. Geri alınamaz.' },
  documents: { title: 'Doküman silinsin mi?', body: 'Doküman, özeti ve "Makineye sor" içindeki yeri kalıcı olarak silinir. Geri alınamaz.' },
};

/** Confirm step before the patron deletes a video or document for good. */
export function DeleteContentDialog({ open, target, pending, error, onConfirm, onClose }: Props) {
  const t = useT();
  const text = TEXT[target?.kind ?? 'videos'];
  return (
    <Dialog open={open && target !== null} onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm gap-5 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true"><Trash2 className="size-7" /></span>
        <DialogHeader className="sm:text-center">
          <DialogTitle className="font-display text-2xl text-steel">{t(text.title)}</DialogTitle>
          <DialogDescription>{t(text.body)}</DialogDescription>
        </DialogHeader>
        {target && <b className="break-words">{target.title}</b>}
        <ErrorMessage error={error} />
        <div className="flex flex-col gap-2">
          <Button variant="danger" loading={pending} onClick={onConfirm}><Trash2 aria-hidden="true" />{t('Evet, sil')}</Button>
          <DialogClose asChild><Button variant="secondary" disabled={pending}>{t('Vazgeç')}</Button></DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
