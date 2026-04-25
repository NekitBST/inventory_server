import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type SelectHTMLAttributes,
} from 'react';
import clsx from 'clsx';

export function Select({
  className,
  children,
  value,
  onChange,
  disabled,
  name,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(() => {
    return Children.toArray(children)
      .filter(isValidElement)
      .map((child) => {
        const valueProp = child.props.value;
        return {
          value: valueProp === undefined ? '' : String(valueProp),
          label: String(child.props.children ?? ''),
          disabled: Boolean(child.props.disabled),
        };
      });
  }, [children]);

  const selectedValue =
    value === undefined || value === null ? '' : String(value);
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? options[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const emitChange = (nextValue: string) => {
    if (!onChange) return;
    const syntheticEvent = {
      target: { value: nextValue, name },
    } as unknown as ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
  };

  return (
    <div ref={rootRef} className={clsx('relative h-10 w-full', className)}>
      <button
        type="button"
        className={clsx(
          'flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm text-slate-800 outline-none transition-all duration-200',
          isOpen
            ? 'border-[#8ab7e6] bg-[rgba(230,241,253,0.72)] ring-2 ring-[rgba(152,193,236,0.24)]'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
        onClick={() => {
          if (!disabled) setIsOpen((previous) => !previous);
        }}
        disabled={disabled}
      >
        <span className="truncate text-left">
          {selectedOption?.label ?? 'Выберите значение'}
        </span>
        <span
          className={clsx(
            'ml-2 text-xs text-slate-600 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        >
          ▼
        </span>
      </button>

      <div
        className={clsx(
          'absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-[#c7daf0] bg-[#f2f8ff] shadow-lg transition-all duration-200 ease-out',
          isOpen
            ? 'pointer-events-auto max-h-72 translate-y-0 opacity-100'
            : 'pointer-events-none max-h-0 -translate-y-1 opacity-0',
        )}
      >
        <ul className="max-h-64 overflow-auto p-1">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150',
                  selectedOption?.value === option.value
                    ? 'bg-[rgba(173,207,241,0.36)] font-medium text-slate-900'
                    : 'bg-[rgba(244,247,252,0.95)] text-slate-800 hover:bg-[rgba(173,207,241,0.24)]',
                  option.disabled && 'cursor-not-allowed opacity-50',
                )}
                disabled={option.disabled}
                onClick={() => {
                  emitChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <select
        className="hidden"
        value={selectedValue}
        onChange={onChange}
        disabled={disabled}
        name={name}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
