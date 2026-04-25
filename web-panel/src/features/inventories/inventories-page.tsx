import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../app/toast-provider';
import { getApiErrorMessage } from '../../lib/api-error';
import { inventoriesApi } from './api';
import { Badge } from '../../components/ui/Badge';

export function InventoriesPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'CLOSED' | ''>('');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(
    null,
  );
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsLimit, setRecordsLimit] = useState(30);
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsResultStatus, setRecordsResultStatus] = useState<
    'FOUND' | 'DAMAGED' | ''
  >('');
  const [pendingCloseId, setPendingCloseId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      sortOrder,
    }),
    [page, search, status, sortOrder],
  );

  const inventoriesQuery = useQuery({
    queryKey: ['inventories', filters],
    queryFn: () => inventoriesApi.getAll(filters),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => inventoriesApi.close(id),
    onSuccess: async () => {
      setPendingCloseId(null);
      pushToast({ title: 'Инвентаризация закрыта', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['inventories'] });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      pushToast({
        title: 'Не удалось завершить инвентаризацию',
        description: message,
        tone: 'error',
      });
    },
  });

  const recordsQuery = useQuery({
    queryKey: [
      'inventory-records',
      selectedInventoryId,
      recordsPage,
      recordsLimit,
      recordsSearch,
      recordsResultStatus,
    ],
    queryFn: () =>
      inventoriesApi.getRecords(selectedInventoryId as string, {
        page: recordsPage,
        limit: recordsLimit,
        search: recordsSearch || undefined,
        resultStatus: recordsResultStatus || undefined,
      }),
    enabled: Boolean(selectedInventoryId),
  });

  const handleOpenRecords = (inventoryId: string) => {
    setSelectedInventoryId(inventoryId);
    setRecordsPage(1);
    setRecordsLimit(30);
    setRecordsSearch('');
    setRecordsResultStatus('');
  };

  return (
    <Card title="Инвентаризации">
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input
          placeholder="Поиск по сотруднику"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />

        <Select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value as 'OPEN' | 'CLOSED' | '');
          }}
        >
          <option value="">Любой статус</option>
          <option value="OPEN">OPEN</option>
          <option value="CLOSED">CLOSED</option>
        </Select>

        <Select
          value={sortOrder}
          onChange={(event) => {
            setPage(1);
            setSortOrder(event.target.value as 'ASC' | 'DESC');
          }}
        >
          <option value="DESC">Дата начала: новые сверху</option>
          <option value="ASC">Дата начала: старые сверху</option>
        </Select>

        <div className="h-10" />
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full min-w-[860px] divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Начало</th>
              <th className="px-3 py-2">Окончание</th>
              <th className="px-3 py-2">Сотрудник</th>
              <th className="px-3 py-2">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {inventoriesQuery.data?.items.map((inventory) => (
              <tr key={inventory.id}>
                <td className="px-3 py-2">
                  <Badge
                    tone={inventory.status === 'OPEN' ? 'warning' : 'success'}
                  >
                    {inventory.status}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {new Date(inventory.startedAt).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  {inventory.finishedAt
                    ? new Date(inventory.finishedAt).toLocaleString()
                    : '-'}
                </td>
                <td className="px-3 py-2">
                  {inventory.createdByUser?.fullName ?? '-'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={() => handleOpenRecords(inventory.id)}
                    >
                      Записи
                    </Button>
                    {inventory.status === 'OPEN' ? (
                      <Button
                        variant="primary"
                        className="px-2 py-1 text-xs"
                        onClick={() => setPendingCloseId(inventory.id)}
                      >
                        Завершить
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inventoriesQuery.data ? (
        <Pagination
          page={inventoriesQuery.data.page}
          limit={inventoriesQuery.data.limit}
          total={inventoriesQuery.data.total}
          onPageChange={setPage}
        />
      ) : null}

      {selectedInventoryId ? (
        <section className="mt-6 rounded-md border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Записи инвентаризации</h3>
            <Button
              variant="secondary"
              onClick={() => setSelectedInventoryId(null)}
            >
              Закрыть
            </Button>
          </div>

          <div className="mb-3 grid gap-2 md:grid-cols-4">
            <Input
              placeholder="Поиск по названию оборудования"
              value={recordsSearch}
              onChange={(event) => {
                setRecordsPage(1);
                setRecordsSearch(event.target.value);
              }}
            />

            <Select
              value={recordsResultStatus}
              onChange={(event) => {
                setRecordsPage(1);
                setRecordsResultStatus(
                  event.target.value as 'FOUND' | 'DAMAGED' | '',
                );
              }}
            >
              <option value="">Любой результат</option>
              <option value="FOUND">FOUND</option>
              <option value="DAMAGED">DAMAGED</option>
            </Select>

            <Select
              value={String(recordsLimit)}
              onChange={(event) => {
                setRecordsPage(1);
                setRecordsLimit(Number(event.target.value));
              }}
            >
              <option value="10">10 на страницу</option>
              <option value="30">30 на страницу</option>
              <option value="50">50 на страницу</option>
              <option value="100">100 на страницу</option>
            </Select>

            <div className="h-10" />
          </div>

          <div className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
            {recordsQuery.data?.items.map((record) => (
              <div key={record.id} className="px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {record.equipment
                        ? `${record.equipment.inventoryNumber} - ${record.equipment.name}`
                        : record.equipmentId}
                    </p>
                    {record.equipment?.type?.name ||
                    record.equipment?.location?.name ? (
                      <p className="truncate text-[13px] text-gray-500">
                        {[
                          record.equipment?.type?.name,
                          record.equipment?.location?.name,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    ) : null}
                  </div>
                  <Badge
                    tone={
                      record.resultStatus === 'DAMAGED' ? 'warning' : 'success'
                    }
                  >
                    {record.resultStatus}
                  </Badge>
                </div>
                <p className="text-[13px] text-gray-500">
                  {new Date(record.scannedAt).toLocaleString()}
                </p>
                {record.comment ? (
                  <p className="text-sm text-gray-700">{record.comment}</p>
                ) : null}
              </div>
            ))}

            {!recordsQuery.isLoading && !recordsQuery.data?.items.length ? (
              <div className="px-3 py-3 text-sm text-gray-500">
                Записи не найдены
              </div>
            ) : null}
          </div>

          {recordsQuery.data ? (
            <Pagination
              page={recordsQuery.data.page}
              limit={recordsQuery.data.limit}
              total={recordsQuery.data.total}
              onPageChange={setRecordsPage}
            />
          ) : null}
        </section>
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(pendingCloseId)}
        title="Завершить инвентаризацию?"
        description="После завершения нельзя добавлять или изменять записи в этой инвентаризации."
        confirmText="Завершить"
        tone="primary"
        isProcessing={closeMutation.isPending}
        onCancel={() => setPendingCloseId(null)}
        onConfirm={() => {
          if (!pendingCloseId) return;
          closeMutation.mutate(pendingCloseId);
        }}
      />
    </Card>
  );
}
