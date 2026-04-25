import { createPortal } from 'react-dom';
import { Button } from './Button';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'primary';
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  tone = 'danger',
  isProcessing = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelText}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? 'Выполняется...' : confirmText}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
