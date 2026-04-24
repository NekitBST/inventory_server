import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { equipmentApi } from './api';
import { referencesApi } from '../references/api';

export function EquipmentPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState<number | undefined>();
  const [typeId, setTypeId] = useState<number | undefined>();
  const [locationId, setLocationId] = useState<number | undefined>();

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      statusId,
      typeId,
      locationId,
    }),
    [page, search, statusId, typeId, locationId],
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
      await queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  return (
    <Card title="Оборудование">
      <div className="mb-4 grid gap-2 md:grid-cols-4">
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
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Инв. номер</th>
              <th className="px-3 py-2">Наименование</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Тип</th>
              <th className="px-3 py-2">Локация</th>
              <th className="px-3 py-2">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {equipmentQuery.data?.items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2">{item.inventoryNumber}</td>
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2">{item.status?.name ?? '-'}</td>
                <td className="px-3 py-2">{item.type?.name ?? '-'}</td>
                <td className="px-3 py-2">{item.location?.name ?? '-'}</td>
                <td className="px-3 py-2">
                  <Button
                    variant="danger"
                    className="px-2 py-1 text-xs"
                    onClick={() => removeMutation.mutate(item.id)}
                  >
                    Удалить
                  </Button>
                </td>
              </tr>
            ))}
            {!equipmentQuery.isLoading && !equipmentQuery.data?.items.length ? (
              <tr>
                <td colSpan={6} className="px-3 py-3 text-center text-gray-500">
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
    </Card>
  );
}
