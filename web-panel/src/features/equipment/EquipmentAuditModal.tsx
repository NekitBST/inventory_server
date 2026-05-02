import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal';
import { equipmentApi } from './api';
import type { EquipmentAuditEvent } from '../../types/entities';

interface EquipmentAuditModalProps {
  isOpen: boolean;
  equipmentId: string | null;
  equipmentName: string;
  inventoryNumber: string;
  onClose: () => void;
}

const actionLabels: Record<string, string> = {
  CREATED: 'Создано',
  UPDATED: 'Обновлено',
  STATUS_CHANGED: 'Статус изменён',
  LOCATION_CHANGED: 'Локация изменена',
  TYPE_CHANGED: 'Тип изменён',
  INVENTORY_SCANNED: 'Инвентаризация',
  INVENTORY_RECORD_UPDATED: 'Запись обновлена',
  DELETED: 'Удалено',
};

export function EquipmentAuditModal({
  isOpen,
  equipmentId,
  equipmentName,
  inventoryNumber,
  onClose,
}: EquipmentAuditModalProps) {
  const timelineQuery = useQuery({
    queryKey: ['equipment-timeline', equipmentId],
    queryFn: () =>
      equipmentId ? equipmentApi.getTimeline(equipmentId) : Promise.resolve([]),
    enabled: isOpen && !!equipmentId,
  });

  const events = timelineQuery.data || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`История изменений: ${inventoryNumber} — ${equipmentName}`}
    >
      <div className="-mx-4 max-h-100 overflow-y-auto px-6 py-5">
        {timelineQuery.isLoading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Нет событий</div>
        ) : (
          <div className="relative">
            <div className="absolute left-1.5 top-4 bottom-4 w-1 bg-slate-300 z-0" />
            <div className="space-y-0">
              {events.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  isTop={index === 0}
                  isLast={index === events.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function TimelineEvent({
  event,
  isTop,
  isLast,
}: {
  event: EquipmentAuditEvent;
  isTop: boolean;
  isLast: boolean;
}) {
  const date = new Date(event.createdAt);
  const formattedDate = date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative pl-8 pb-4">
      <div
        className={`absolute left-0 top-1 w-4 ${isLast ? 'h-34 sm:h-24' : 'h-4'} rounded-full bg-white z-10`}
      />

      <div
        className={`absolute left-0 top-0 w-4 h-4 rounded-full border-2 z-10 ${
          isTop
            ? 'bg-slate-900 border-slate-900'
            : 'bg-gray-300 border-gray-400'
        }`}
      />

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-gray-900">
              {actionLabels[event.action] || event.action}
            </p>
            <p className="mt-0.5 text-sm text-gray-600">{event.summary}</p>
          </div>
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {formattedDate}
          </p>
        </div>

        {event.actorName && (
          <p className="mt-2 text-sm text-gray-500">
            <span className="font-medium">Пользователь:</span> {event.actorName}
          </p>
        )}

        {event.reason && (
          <p className="mt-2 text-sm text-gray-700">
            <span className="font-medium">Причина:</span> {event.reason}
          </p>
        )}

        {event.details && (
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            <span className="font-medium">Подробно:</span> {event.details}
          </p>
        )}

        {event.fromState && event.toState && (
          <div className="mt-2 space-y-1 text-sm">
            <p className="font-medium text-gray-700">Изменения:</p>
            <div className="bg-white rounded p-2 border border-gray-200">
              <StateChanges from={event.fromState} to={event.toState} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StateChanges({
  from,
  to,
}: {
  from: Record<string, unknown>;
  to: Record<string, unknown>;
}) {
  const changes: Array<[key: string, oldVal: unknown, newVal: unknown]> = [];

  const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

  for (const key of allKeys) {
    const oldVal = from[key];
    const newVal = to[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push([key, oldVal, newVal]);
    }
  }

  if (changes.length === 0)
    return <p className="text-gray-600">Нет явных изменений</p>;

  return (
    <div className="space-y-1">
      {changes.map(([key, oldVal, newVal]) => (
        <div key={key} className="text-gray-700">
          <span className="font-medium">{key}:</span>{' '}
          <span className="line-through text-gray-500">{String(oldVal)}</span> →{' '}
          <span className="text-green-600">{String(newVal)}</span>
        </div>
      ))}
    </div>
  );
}
