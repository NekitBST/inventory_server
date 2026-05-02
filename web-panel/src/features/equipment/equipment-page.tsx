import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../app/toast-provider';
import { equipmentApi } from './api';
import { EquipmentAuditModal } from './EquipmentAuditModal';
import { referencesApi } from '../references/api';
import { getApiErrorMessage } from '../../lib/api-error';
import { readPageLimit, savePageLimit } from '../../lib/page-limit-storage';
import type { Equipment, EquipmentPayload } from '../../types/entities';

type EquipmentFormState = {
  inventoryNumber: string;
  name: string;
  serialNumber: string;
  statusId: string;
  typeId: string;
  locationId: string;
};

const initialFormState: EquipmentFormState = {
  inventoryNumber: '',
  name: '',
  serialNumber: '',
  statusId: '',
  typeId: '',
  locationId: '',
};

export function EquipmentPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() =>
    readPageLimit('equipment.list.limit', 20),
  );
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState<number | undefined>();
  const [typeId, setTypeId] = useState<number | undefined>();
  const [locationId, setLocationId] = useState<number | undefined>();
  const [form, setForm] = useState<EquipmentFormState>(initialFormState);
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(
    null,
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [auditModalEquipmentId, setAuditModalEquipmentId] = useState<
    string | null
  >(null);
  const [auditModalEquipmentName, setAuditModalEquipmentName] = useState('');
  const [auditModalInventoryNumber, setAuditModalInventoryNumber] =
    useState('');
  const [formError, setFormError] = useState('');

  const invalidateEquipmentRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['equipment'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment-timeline'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-records'] }),
      queryClient.invalidateQueries({ queryKey: ['reports'] }),
      queryClient.invalidateQueries({
        queryKey: ['label-generator-equipment'],
      }),
    ]);
  };

  const filters = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      statusId,
      typeId,
      locationId,
    }),
    [page, limit, search, statusId, typeId, locationId],
  );

  const equipmentQuery = useQuery({
    queryKey: ['equipment', filters],
    queryFn: () => equipmentApi.getAll(filters),
  });

  const statusesQuery = useQuery({
    queryKey: ['reference', 'equipment-statuses'],
    queryFn: () => referencesApi.getAll('equipment-statuses'),
  });

  const typesQuery = useQuery({
    queryKey: ['reference', 'equipment-types'],
    queryFn: () => referencesApi.getAll('equipment-types'),
  });

  const locationsQuery = useQuery({
    queryKey: ['reference', 'locations'],
    queryFn: () => referencesApi.getAll('locations'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => equipmentApi.remove(id),
    onSuccess: async () => {
      setPendingDeleteId(null);
      pushToast({ title: 'Оборудование удалено', tone: 'warning' });
      await invalidateEquipmentRelatedQueries();
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      pushToast({
        title: 'Не удалось удалить оборудование',
        description: message,
        tone: 'error',
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: EquipmentPayload) => equipmentApi.create(payload),
    onSuccess: async () => {
      setForm(initialFormState);
      setFormError('');
      pushToast({ title: 'Оборудование создано', tone: 'success' });
      await invalidateEquipmentRelatedQueries();
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      setFormError(message);
      pushToast({
        title: 'Ошибка создания оборудования',
        description: message,
        tone: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EquipmentPayload }) =>
      equipmentApi.update(id, payload),
    onSuccess: async () => {
      setEditingEquipmentId(null);
      setForm(initialFormState);
      setFormError('');
      pushToast({ title: 'Оборудование обновлено', tone: 'info' });
      await invalidateEquipmentRelatedQueries();
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      setFormError(message);
      pushToast({
        title: 'Ошибка обновления оборудования',
        description: message,
        tone: 'error',
      });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    savePageLimit('equipment.list.limit', limit);
  }, [limit]);

  const handleStartEdit = (item: Equipment) => {
    setEditingEquipmentId(item.id);
    setForm({
      inventoryNumber: item.inventoryNumber,
      name: item.name,
      serialNumber: item.serialNumber ?? '',
      statusId: String(item.statusId),
      typeId: String(item.typeId),
      locationId: item.locationId ? String(item.locationId) : '',
    });
    setFormError('');
  };

  const handleCancelEdit = () => {
    setEditingEquipmentId(null);
    setForm(initialFormState);
    setFormError('');
  };

  const handleOpenAudit = (item: Equipment) => {
    setAuditModalEquipmentId(item.id);
    setAuditModalEquipmentName(item.name);
    setAuditModalInventoryNumber(item.inventoryNumber);
  };

  const handleCloseAudit = () => {
    setAuditModalEquipmentId(null);
    setAuditModalEquipmentName('');
    setAuditModalInventoryNumber('');
  };

  const handleSubmitForm = async () => {
    const inventoryNumber = form.inventoryNumber.trim();
    const name = form.name.trim();
    const serialNumber = form.serialNumber.trim();

    if (!inventoryNumber || !name || !form.statusId || !form.typeId) {
      setFormError('Заполните обязательные поля: номер, название, статус, тип');
      return;
    }

    const payload: EquipmentPayload = {
      inventoryNumber,
      name,
      serialNumber: serialNumber || null,
      statusId: Number(form.statusId),
      typeId: Number(form.typeId),
      locationId: form.locationId ? Number(form.locationId) : null,
    };

    if (editingEquipmentId) {
      await updateMutation.mutateAsync({ id: editingEquipmentId, payload });
      return;
    }

    await createMutation.mutateAsync(payload);
  };

  return (
    <Card title="Оборудование">
      <section className="mb-5 rounded-md border border-gray-200 p-3">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          {editingEquipmentId
            ? 'Редактирование оборудования'
            : 'Новое оборудование'}
        </h3>

        <div className="grid gap-2 md:grid-cols-3">
          <Input
            placeholder="Инвентарный номер*"
            value={form.inventoryNumber}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                inventoryNumber: event.target.value,
              }))
            }
          />

          <Input
            placeholder="Наименование*"
            value={form.name}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, name: event.target.value }))
            }
          />

          <Input
            placeholder="Серийный номер (опционально)"
            value={form.serialNumber}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                serialNumber: event.target.value,
              }))
            }
          />

          <Select
            value={form.statusId}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                statusId: event.target.value,
              }))
            }
          >
            <option value="">Статус*</option>
            {statusesQuery.data?.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </Select>

          <Select
            value={form.typeId}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                typeId: event.target.value,
              }))
            }
          >
            <option value="">Тип*</option>
            {typesQuery.data?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>

          <Select
            value={form.locationId}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                locationId: event.target.value,
              }))
            }
          >
            <option value="">Локация (опционально)</option>
            {locationsQuery.data?.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        </div>

        {formError ? (
          <p className="mt-2 text-sm text-red-600">{formError}</p>
        ) : null}

        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => void handleSubmitForm()}
            disabled={isSubmitting}
          >
            {editingEquipmentId ? 'Сохранить изменения' : 'Создать'}
          </Button>
          {editingEquipmentId ? (
            <Button variant="secondary" onClick={handleCancelEdit}>
              Отмена
            </Button>
          ) : null}
        </div>
      </section>

      <div className="mb-4 grid gap-2 md:grid-cols-5">
        <Input
          placeholder="Поиск по названию/номеру"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />

        <Select
          value={statusId ?? ''}
          onChange={(event) => {
            setPage(1);
            setStatusId(
              event.target.value ? Number(event.target.value) : undefined,
            );
          }}
        >
          <option value="">Все статусы</option>
          {statusesQuery.data?.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </Select>

        <Select
          value={typeId ?? ''}
          onChange={(event) => {
            setPage(1);
            setTypeId(
              event.target.value ? Number(event.target.value) : undefined,
            );
          }}
        >
          <option value="">Все типы</option>
          {typesQuery.data?.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>

        <Select
          value={locationId ?? ''}
          onChange={(event) => {
            setPage(1);
            setLocationId(
              event.target.value ? Number(event.target.value) : undefined,
            );
          }}
        >
          <option value="">Все локации</option>
          {locationsQuery.data?.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </Select>

        <Select
          value={String(limit)}
          onChange={(event) => {
            setPage(1);
            setLimit(Number(event.target.value));
          }}
        >
          <option value="10">10 на страницу</option>
          <option value="20">20 на страницу</option>
          <option value="50">50 на страницу</option>
          <option value="100">100 на страницу</option>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full min-w-[980px] divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Инв. номер</th>
              <th className="px-3 py-2">Наименование</th>
              <th className="px-3 py-2">Серийный номер</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Тип</th>
              <th className="px-3 py-2">Локация</th>
              <th className="px-3 py-2">Обновлено</th>
              <th className="px-3 py-2">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {equipmentQuery.data?.items.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleOpenAudit(item)}
              >
                <td className="px-3 py-2">{item.inventoryNumber}</td>
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2">{item.serialNumber ?? '-'}</td>
                <td className="px-3 py-2">{item.status?.name ?? '-'}</td>
                <td className="px-3 py-2">{item.type?.name ?? '-'}</td>
                <td className="px-3 py-2">{item.location?.name ?? '-'}</td>
                <td className="px-3 py-2">
                  {new Date(item.updatedAt).toLocaleString('ru-RU')}
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => handleStartEdit(item)}
                    >
                      Изменить
                    </Button>
                    <Button
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() => setPendingDeleteId(item.id)}
                    >
                      Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!equipmentQuery.isLoading && !equipmentQuery.data?.items.length ? (
              <tr>
                <td colSpan={8} className="px-3 py-3 text-center text-gray-500">
                  Ничего не найдено
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {equipmentQuery.data ? (
        <Pagination
          page={equipmentQuery.data.page}
          limit={equipmentQuery.data.limit}
          total={equipmentQuery.data.total}
          onPageChange={setPage}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(pendingDeleteId)}
        title="Удалить оборудование?"
        description="Запись будет удалена и исчезнет из активного списка."
        confirmText="Удалить"
        tone="danger"
        isProcessing={removeMutation.isPending}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return;
          removeMutation.mutate(pendingDeleteId);
        }}
      />

      <EquipmentAuditModal
        isOpen={Boolean(auditModalEquipmentId)}
        equipmentId={auditModalEquipmentId}
        equipmentName={auditModalEquipmentName}
        inventoryNumber={auditModalInventoryNumber}
        onClose={handleCloseAudit}
      />
    </Card>
  );
}
