import { Plus, QrCode, ScanLine, SearchX } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { useT } from '../../../../i18n';

interface Props {
  /** The scanned QR text or the typed code that matched no machine; null = closed. */
  code: string | null;
  /** It was typed into the code box, not read from a QR. */
  typed?: boolean;
  /** Given to users who may add machines (`me.can_add_machines`): the dialog asks whether to add one with it. */
  onAdd?: () => void;
  onClose: () => void;
}

const TEXT = {
  missing: { title: 'Makine bulunamadı', body: 'Bu QR ya da kod hiçbir makineye ait değil. Makinenin üzerindeki etiketi kontrol edin veya kodu elle yazın.' },
  newQr: { title: 'Yeni QR', body: 'Bu QR henüz hiçbir makineye bağlı değil. Bu QR ile yeni bir makine eklemek ister misiniz?' },
  newCode: { title: 'Yeni makine kodu', body: 'Bu kodla bir makine yok. Bu kodla yeni bir makine eklemek ister misiniz?' },
};

/** A scanned QR or typed code that belongs to no machine. Workers: "not found", scan again. Ustas and the patron:
 * "add a machine with it?" (KAN-29, KAN-27). Closing it lets the camera scan again. */
export function NotFoundDialog({ code, typed = false, onAdd, onClose }: Props) {
  const t = useT();
  const text = onAdd ? (typed ? TEXT.newCode : TEXT.newQr) : TEXT.missing;
  return (
    <Dialog open={code !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm gap-5 text-center">
        {onAdd ? (
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/20 text-steel" aria-hidden="true"><QrCode className="size-7" /></span>
        ) : (
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true"><SearchX className="size-7" /></span>
        )}
        <DialogHeader className="sm:text-center">
          <DialogTitle className="font-display text-2xl text-steel">{t(text.title)}</DialogTitle>
          <DialogDescription>{t(text.body)}</DialogDescription>
        </DialogHeader>
        {code && <code dir="ltr" className="mx-auto max-w-full truncate rounded bg-muted px-2 py-1 font-mono text-sm">{code}</code>}
        {onAdd ? (
          <div className="flex flex-col gap-2">
            <Button onClick={onAdd}><Plus aria-hidden="true" />{t('Evet, makine ekle')}</Button>
            <DialogClose asChild><Button variant="secondary"><ScanLine aria-hidden="true" />{t('Hayır, tekrar tara')}</Button></DialogClose>
          </div>
        ) : (
          <DialogClose asChild><Button>{t('Tekrar tara')}</Button></DialogClose>
        )}
      </DialogContent>
    </Dialog>
  );
}
