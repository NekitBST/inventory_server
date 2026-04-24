import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

type CardProps = PropsWithChildren<{
  className?: string;
  title?: string;
}>;

export function Card({ className, title, children }: CardProps) {
  return (
    <section
      className={clsx(
        'rounded-xl border border-gray-200 bg-white p-4',
        className,
      )}
    >
      {title ? (
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}
