import { SearchX } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { useT } from '../../../../i18n';

/** Shown when a scanned QR or typed code belongs to no machine; closing it lets the camera scan again. */
export function NotFoundDialog({ code, onClose }: { code: string | null; onClose: () => void }) {
  const t = useT();
  return (
    <Dialog open={code !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm gap-5 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true">
          <SearchX className="size-7" />
        </span>
        <DialogHeader className="sm:text-center">
          <DialogTitle className="font-display text-2xl text-steel">{t('Makine bulunamadı')}</DialogTitle>
          <DialogDescription>{t('Bu QR ya da kod hiçbir makineye ait değil. Makinenin üzerindeki etiketi kontrol edin veya kodu elle yazın.')}</DialogDescription>
        </DialogHeader>
        {code && <code dir="ltr" className="mx-auto max-w-full truncate rounded bg-muted px-2 py-1 font-mono text-sm">{code}</code>}
        <DialogClose asChild><Button>{t('Tekrar tara')}</Button></DialogClose>
      </DialogContent>
    </Dialog>
  );
}
