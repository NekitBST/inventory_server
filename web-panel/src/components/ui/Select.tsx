import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-500',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
