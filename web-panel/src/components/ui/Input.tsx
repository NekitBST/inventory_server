import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-gray-500',
        className,
      )}
      {...props}
    />
  );
}
