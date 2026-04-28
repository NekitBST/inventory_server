import { Input } from '../../components/ui/Input';
import type { LabelSize } from './types';

type LabelSettingsProps = {
  size: LabelSize;
  onChange: (size: LabelSize) => void;
};

export function LabelSettings({ size, onChange }: LabelSettingsProps) {
  const updateField = (field: keyof LabelSize, value: string) => {
    const nextValue = Number.parseFloat(value);
    if (!Number.isNaN(nextValue) && nextValue > 0) {
      onChange({ ...size, [field]: nextValue });
    }
  };

  const updateBooleanField = (field: keyof LabelSize, value: boolean) => {
    onChange({ ...size, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Настройки размера этикетки
      </h3>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Размеры этикетки
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="label-width"
            >
              Ширина (см)
            </label>
            <Input
              id="label-width"
              type="number"
              step="0.1"
              min="1"
              value={size.width}
              onChange={(event) =>
                updateField('width', event.currentTarget.value)
              }
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="label-height"
            >
              Высота (см)
            </label>
            <Input
              id="label-height"
              type="number"
              step="0.1"
              min="1"
              value={size.height}
              onChange={(event) =>
                updateField('height', event.currentTarget.value)
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Отступы
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="border-margin"
            >
              Граница (см)
            </label>
            <Input
              id="border-margin"
              type="number"
              step="0.1"
              min="0"
              value={size.borderMargin}
              onChange={(event) =>
                updateField('borderMargin', event.currentTarget.value)
              }
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="name-margin"
            >
              Отступ наименования (см)
            </label>
            <Input
              id="name-margin"
              type="number"
              step="0.1"
              min="0"
              value={size.nameMargin}
              onChange={(event) =>
                updateField('nameMargin', event.currentTarget.value)
              }
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="name-spacing"
            >
              Отступ QR + номера (см)
            </label>
            <Input
              id="name-spacing"
              type="number"
              step="0.1"
              min="0"
              value={size.nameSpacing}
              onChange={(event) =>
                updateField('nameSpacing', event.currentTarget.value)
              }
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="text-spacing"
            >
              Расстояние QR-текст (см)
            </label>
            <Input
              id="text-spacing"
              type="number"
              step="0.1"
              min="0"
              value={size.textSpacing}
              onChange={(event) =>
                updateField('textSpacing', event.currentTarget.value)
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Размеры шрифтов
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="name-font-size"
            >
              Инвентарный номер (pt)
            </label>
            <Input
              id="name-font-size"
              type="number"
              step="0.5"
              min="6"
              max="20"
              value={size.nameFontSize}
              onChange={(event) =>
                updateField('nameFontSize', event.currentTarget.value)
              }
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700"
              htmlFor="field-font-size"
            >
              Основной текст (pt)
            </label>
            <Input
              id="field-font-size"
              type="number"
              step="0.5"
              min="6"
              max="20"
              value={size.fieldFontSize}
              onChange={(event) =>
                updateField('fieldFontSize', event.currentTarget.value)
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Настройки QR-кода
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={size.qrAutoSize}
              onChange={(event) =>
                updateBooleanField('qrAutoSize', event.currentTarget.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            Автоматический размер QR кода
          </label>

          {!size.qrAutoSize ? (
            <div className="ml-6">
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="qr-size"
              >
                Размер QR кода (см)
              </label>
              <Input
                id="qr-size"
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={size.qrSize}
                onChange={(event) =>
                  updateField('qrSize', event.currentTarget.value)
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Дополнительные настройки
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={size.showInventoryNumber}
              onChange={(event) =>
                updateBooleanField(
                  'showInventoryNumber',
                  event.currentTarget.checked,
                )
              }
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            Показывать инвентарный номер
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={size.showSerialNumber}
              onChange={(event) =>
                updateBooleanField(
                  'showSerialNumber',
                  event.currentTarget.checked,
                )
              }
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            Показывать серийный номер
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={size.showDate}
              onChange={(event) =>
                updateBooleanField('showDate', event.currentTarget.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            Показывать дату
          </label>

          {size.showDate ? (
            <div className="ml-6">
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="date-font-size"
              >
                Размер шрифта даты (pt)
              </label>
              <Input
                id="date-font-size"
                type="number"
                step="0.5"
                min="6"
                max="20"
                value={size.dateFontSize}
                onChange={(event) =>
                  updateField('dateFontSize', event.currentTarget.value)
                }
              />
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={size.showBorder}
              onChange={(event) =>
                updateBooleanField('showBorder', event.currentTarget.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            Показывать обводку границ
          </label>
        </div>
      </div>
    </div>
  );
}
