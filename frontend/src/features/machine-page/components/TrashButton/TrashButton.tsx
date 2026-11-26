import { Trash2 } from 'lucide-react';

interface Props {
  label: string; // e.g. "Sil: Kesim videosu" (the icon alone has no text)
  onClick: () => void;
}

/** Small trash icon at the end of a list row; the row's own link stays a separate tap target. */
export function TrashButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Trash2 className="size-5" aria-hidden="true" />
    </button>
  );
}
