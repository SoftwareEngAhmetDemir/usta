import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';
import { cn } from 'cn';

type Props = ComponentProps<'div'> & { asChild?: boolean };

/** One row of a list inside a card (thumbnail + text + status); `asChild` makes the whole row a Link or button. */
export function ListItem({ asChild = false, className, ...rest }: Props) {
  const Comp = asChild ? Slot.Root : 'div';
  return (
    <Comp
      {...rest}
      className={cn(
        'flex w-full items-center gap-3 border-t border-border py-3 text-start text-inherit no-underline first:border-t-0 first:pt-0 last:pb-0',
        asChild && 'transition-colors hover:bg-muted/40',
        className,
      )}
    />
  );
}
