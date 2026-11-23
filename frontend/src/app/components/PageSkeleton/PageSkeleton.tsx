import { Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

/** Stand-in for a page while its texts are translated into the new language: the shape of a typical screen
 * (title, header card, main action, a list), named in that language since its UI texts are not there yet. */
export function PageSkeleton({ languageName }: { languageName: string }) {
  return (
    <output className="flex flex-col gap-4" aria-busy="true">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {languageName}…
      </span>
      <Skeleton className="h-8 w-44" />
      <Card className="flex-row gap-4">
        <Skeleton className="size-20 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2.5 pt-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3.5 w-2/5" />
        </div>
      </Card>
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="mt-2 h-5 w-32" />
      <Card className="gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-16 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </Card>
    </output>
  );
}
