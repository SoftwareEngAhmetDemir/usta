import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';
import { cn } from 'cn';

type Props = ComponentProps<'button'> & { asChild?: boolean };

/** Small rounded action or toggle (aria-pressed shows as selected); `asChild` styles a Link or <a> instead. */
export function Chip({ asChild = false, className, type, ...rest }: Props) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      {...rest}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full border py-1.5 border-input bg-card px-3.5 text-sm font-medium text-foreground no-underline transition-colors',
        'hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0',
        'aria-pressed:border-steel aria-pressed:bg-steel aria-pressed:text-steel-foreground',
        className,
      )}
    />
  );
}
