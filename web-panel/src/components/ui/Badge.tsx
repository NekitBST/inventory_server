import clsx from 'clsx';
import type { PropsWithChildren } from 'react';

type BadgeProps = PropsWithChildren<{
  tone?: 'default' | 'success' | 'warning';
}>;

export function Badge({ tone = 'default', children }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2 py-1 text-xs font-medium',
        {
          'bg-gray-100 text-gray-700': tone === 'default',
          'bg-green-100 text-green-700': tone === 'success',
          'bg-amber-100 text-amber-700': tone === 'warning',
        },
      )}
    >
      {children}
    </span>
  );
}
