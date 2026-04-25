import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

type ToastTone = 'success' | 'error' | 'info' | 'warning';

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function toneClassName(tone: ToastTone) {
  if (tone === 'success') {
    return 'border-emerald-300 bg-emerald-50 text-emerald-900';
  }
  if (tone === 'error') {
    return 'border-rose-300 bg-rose-50 text-rose-900';
  }
  if (tone === 'warning') {
    return 'border-amber-300 bg-amber-50 text-amber-900';
  }
  return 'border-sky-300 bg-sky-50 text-sky-900';
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ title, description, tone = 'info', durationMs = 3500 }: ToastInput) => {
      const id = nextIdRef.current++;
      setToasts((previous) => [...previous, { id, title, description, tone }]);

      window.setTimeout(() => {
        removeToast(id);
      }, durationMs);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast,
    }),
    [pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <section
            key={toast.id}
            className={[
              'pointer-events-auto rounded-lg border px-3 py-2 shadow-sm backdrop-blur-sm',
              toneClassName(toast.tone),
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs opacity-90">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded px-1 text-xs opacity-70 transition hover:opacity-100"
                aria-label="Закрыть уведомление"
                onClick={() => removeToast(toast.id)}
              >
                ×
              </button>
            </div>
          </section>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
