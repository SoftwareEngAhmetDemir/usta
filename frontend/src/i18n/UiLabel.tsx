import { useContext } from 'react';
import { cn } from 'cn';
import { Skeleton } from '../components/ui/skeleton';
import { UiReadyContext } from './context';
import { useT } from './useT';

/** A label of the app chrome (header, bottom menu): a skeleton bar only until this one text is translated, so
 * opening another page never blanks labels that are already done. Screen readers get the text meanwhile. */
export function UiLabel({ text, skeletonClassName }: { text: string; skeletonClassName?: string }) {
  const t = useT();
  const ready = useContext(UiReadyContext);
  const shown = t(text);
  if (ready(text)) return <>{shown}</>;
  return (
    <>
      <Skeleton className={cn('h-3 w-12', skeletonClassName)} />
      <span className="sr-only">{shown}</span>
    </>
  );
}
