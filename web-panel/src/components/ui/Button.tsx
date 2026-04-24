import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'clsx';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement>
> & {
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        {
          'border-gray-900 bg-gray-900 text-white hover:bg-gray-800':
            variant === 'primary',
          'border-gray-300 bg-white text-gray-800 hover:bg-gray-50':
            variant === 'secondary',
          'border-red-200 bg-red-50 text-red-700 hover:bg-red-100':
            variant === 'danger',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
