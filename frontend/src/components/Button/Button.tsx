import { Loader2 } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from 'cn';
import { Button as UiButton } from '../ui/button';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'normal' | 'small';
  loading?: boolean;
  /** Style the single child (a Link or <a>) as this button instead of rendering a <button>. */
  asChild?: boolean;
}

const VARIANT = { primary: 'default', secondary: 'outline', danger: 'destructive' } as const;

/** The app's button: big and full width on phones by default (gloved hands), `small` for inline actions. */
export function Button({ variant = 'primary', size = 'normal', loading = false, asChild = false, disabled, type = 'button', children, className, ...rest }: ButtonProps) {
  return (
    <UiButton
      {...rest}
      asChild={asChild}
      data-variant={variant}
      type={asChild ? undefined : type}
      variant={VARIANT[variant]}
      size={size === 'small' ? 'sm' : 'lg'}
      className={cn(
        'font-semibold',
        size === 'normal' && 'h-12 w-full rounded-lg text-base',
        variant === 'secondary' && 'border-steel/40 text-steel',
        asChild && 'no-underline',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {asChild ? children : <>{loading && <Loader2 className="animate-spin" aria-hidden="true" />}{children}</>}
    </UiButton>
  );
}
