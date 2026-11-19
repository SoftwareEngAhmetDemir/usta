import type { ComponentPropsWithoutRef } from 'react';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'normal' | 'small';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'normal', loading = false, disabled, type = 'button', children, className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={className ? `btn ${className}` : 'btn'}
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {children}
    </button>
  );
}
