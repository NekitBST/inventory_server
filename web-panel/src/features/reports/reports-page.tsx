import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../app/toast-provider';
import { getApiErrorMessage } from '../../lib/api-error';
import { exportReportFile } from '../../lib/report-export';
import { equipmentApi } from '../equipment/api';
import { inventoriesApi } from '../inventories/api';
import { referencesApi } from '../references/api';
import type { Equipment, InventoryRecord } from '../../types/entities';

type ReportType = 'equipment' | 'inventory-records';
type ExportFormat = 'csv' | 'xlsx';

type EquipmentColumnKey =
  | 'inventoryNumber'
  | 'name'
  | 'serialNumber'
  | 'statusName'
  | 'typeName'
  | 'locationName';

type InventoryRecordColumnKey =
  | 'inventoryNumber'
  | 'name'
  | 'serialNumber'
  | 'equipmentStatus'
  | 'typeName'
  | 'locationName'
  | 'resultStatus'
  | 'comment'
  | 'scannedAt';

type EquipmentReportRow = {
  id: string;
  inventoryNumber: string;
  name: string;
  serialNumber: string;
  statusName: string;
  typeName: string;
  locationName: string;
};

type InventoryRecordsReportRow = {
  inventoryNumber: string;
  name: string;
  serialNumber: string;
  equipmentStatus: string;
  typeName: string;
  locationName: string;
  resultStatus: string;
  comment: string;
  scannedAt: string;
};

const equipmentColumns: Array<{ key: EquipmentColumnKey; label: string }> = [
  { key: 'inventoryNumber', label: 'Инвентарный номер' },
  { key: 'name', label: 'Наименование' },
  { key: 'serialNumber', label: 'Серийный номер' },
  { key: 'statusName', label: 'Статус' },
  { key: 'typeName', label: 'Тип' },
  { key: 'locationName', label: 'Локация' },
];

const inventoryRecordColumns: Array<{
  key: InventoryRecordColumnKey;
  label: string;
}> = [
  { key: 'inventoryNumber', label: 'Инвентарный номер' },
  { key: 'name', label: 'Наименование' },
  { key: 'serialNumber', label: 'Серийный номер' },
  { key: 'equipmentStatus', label: 'Статус оборудования' },
  { key: 'typeName', label: 'Тип' },
  { key: 'locationName', label: 'Локация' },
  { key: 'resultStatus', label: 'Результат' },
  { key: 'comment', label: 'Комментарий' },
  { key: 'scannedAt', label: 'Сканировано' },
];

function toDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function toResultStatusLabel(value: 'FOUND' | 'DAMAGED'): string {
  return value === 'FOUND' ? 'Найдено' : 'Повреждено';
}

function toInventoryStatusLabel(value: 'OPEN' | 'CLOSED'): string {
  return value === 'OPEN' ? 'Открытая' : 'Закрытая';
}

async function fetchAllEquipment(params: {
  search?: string;
  statusId?: number;
  typeId?: number;
  locationId?: number;
}): Promise<Equipment[]> {
  const items: Equipment[] = [];
  let page = 1;
  let keepLoading = true;

  while (keepLoading) {
    const response = await equipmentApi.getAll({
      page,
      limit: 500,
      ...params,
    });
    items.push(...response.items);

    keepLoading = page * response.limit < response.total;
    page += 1;
  }

  return items;
}

async function fetchAllInventoryRecords(params: {
  inventoryId: string;
  search?: string;
  resultStatus?: 'FOUND' | 'DAMAGED';
}): Promise<InventoryRecord[]> {
  const items: InventoryRecord[] = [];
  let page = 1;
  let keepLoading = true;

  while (keepLoading) {
    const response = await inventoriesApi.getRecords(params.inventoryId, {
      page,
      limit: 500,
      search: params.search,
      resultStatus: params.resultStatus,
    });
    items.push(...response.items);

    keepLoading = page * response.limit < response.total;
    page += 1;
  }

  return items;
}

export function ReportsPage() {
  const { pushToast } = useToast();
  const [reportType, setReportType] = useState<ReportType>('equipment');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState<number | undefined>();
  const [typeId, setTypeId] = useState<number | undefined>();
  const [locationId, setLocationId] = useState<number | undefined>();

  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [recordsResultStatus, setRecordsResultStatus] = useState<
    'FOUND' | 'DAMAGED' | ''
  >('');
  const [recordsSearch, setRecordsSearch] = useState('');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    [],
  );

  const [selectedEquipmentColumns, setSelectedEquipmentColumns] = useState<
    EquipmentColumnKey[]
  >(equipmentColumns.map((column) => column.key));

  const [selectedRecordColumns, setSelectedRecordColumns] = useState<
    InventoryRecordColumnKey[]
  >(inventoryRecordColumns.map((column) => column.key));

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

  const inventoriesQuery = useQuery({
    queryKey: ['inventories', 'report-picker'],
    queryFn: () =>
      inventoriesApi.getAll({
        page: 1,
        limit: 500,
        sortOrder: 'DESC',
      }),
  });

  const equipmentPreviewQuery = useQuery({
    queryKey: [
      'reports',
      'equipment-preview',
      search,
      statusId,
      typeId,
      locationId,
    ],
    queryFn: () =>
      fetchAllEquipment({
        search: search || undefined,
        statusId,
        typeId,
        locationId,
      }),
    enabled: reportType === 'equipment',
  });

  const inventoryRecordsPreviewQuery = useQuery({
    queryKey: [
      'reports',
      'inventory-records-preview',
      selectedInventoryId,
      recordsResultStatus,
      recordsSearch,
    ],
    queryFn: () =>
      fetchAllInventoryRecords({
        inventoryId: selectedInventoryId,
        search: recordsSearch || undefined,
        resultStatus: recordsResultStatus || undefined,
      }),
    enabled: reportType === 'inventory-records' && Boolean(selectedInventoryId),
  });

  const closedInventories = useMemo(
    () =>
      inventoriesQuery.data?.items.filter(
        (inventory) => inventory.status === 'CLOSED',
      ) ?? [],
    [inventoriesQuery.data?.items],
  );

  useEffect(() => {
    if (reportType !== 'equipment') return;
    const ids = equipmentPreviewQuery.data?.map((item) => item.id) ?? [];
    setSelectedEquipmentIds(ids);
  }, [equipmentPreviewQuery.data, reportType]);

  const selectedColumnsCount = useMemo(() => {
    return reportType === 'equipment'
      ? selectedEquipmentColumns.length
      : selectedRecordColumns.length;
  }, [
    reportType,
    selectedEquipmentColumns.length,
    selectedRecordColumns.length,
  ]);

  const toggleEquipmentColumn = (column: EquipmentColumnKey) => {
    setSelectedEquipmentColumns((previous) =>
      previous.includes(column)
        ? previous.filter((key) => key !== column)
        : [...previous, column],
    );
  };

  const toggleRecordColumn = (column: InventoryRecordColumnKey) => {
    setSelectedRecordColumns((previous) =>
      previous.includes(column)
        ? previous.filter((key) => key !== column)
        : [...previous, column],
    );
  };

  const selectAllEquipmentColumns = () => {
    setSelectedEquipmentColumns(equipmentColumns.map((column) => column.key));
  };

  const selectAllRecordColumns = () => {
    setSelectedRecordColumns(
      inventoryRecordColumns.map((column) => column.key),
    );
  };

  const handleExport = async () => {
    if (selectedColumnsCount === 0) {
      pushToast({
        title: 'Выберите хотя бы один столбец',
        tone: 'warning',
      });
      return;
    }

    if (reportType === 'inventory-records' && !selectedInventoryId) {
      pushToast({
        title: 'Выберите инвентаризацию для отчета',
        tone: 'warning',
      });
      return;
    }

    if (reportType === 'equipment' && selectedEquipmentIds.length === 0) {
      pushToast({
        title: 'Выберите хотя бы одну запись оборудования',
        tone: 'warning',
      });
      return;
    }

    try {
      setIsExporting(true);

      if (reportType === 'equipment') {
        const equipment = equipmentPreviewQuery.data ?? [];
        const selectedRows = equipment.filter((item) =>
          selectedEquipmentIds.includes(item.id),
        );

        const rows: EquipmentReportRow[] = selectedRows.map((item) => ({
          id: item.id,
          inventoryNumber: item.inventoryNumber,
          name: item.name,
          serialNumber: item.serialNumber ?? '',
          statusName: item.status?.name ?? '',
          typeName: item.type?.name ?? '',
          locationName: item.location?.name ?? '',
        }));

        await exportReportFile<EquipmentReportRow>({
          rows,
          columns: equipmentColumns,
          selectedColumnKeys: selectedEquipmentColumns,
          format,
          baseFileName: 'equipment_report',
        });

        pushToast({ title: 'Отчет по оборудованию выгружен', tone: 'success' });
        return;
      }

      const records = inventoryRecordsPreviewQuery.data ?? [];

      const rows: InventoryRecordsReportRow[] = records.map((record) => ({
        inventoryNumber: record.equipment?.inventoryNumber ?? '',
        name: record.equipment?.name ?? '',
        serialNumber: record.equipment?.serialNumber ?? '',
        equipmentStatus: record.equipment?.status?.name ?? '',
        typeName: record.equipment?.type?.name ?? '',
        locationName: record.equipment?.location?.name ?? '',
        resultStatus: toResultStatusLabel(record.resultStatus),
        comment: record.comment ?? '',
        scannedAt: toDateTime(record.scannedAt),
      }));

      await exportReportFile<InventoryRecordsReportRow>({
        rows,
        columns: inventoryRecordColumns,
        selectedColumnKeys: selectedRecordColumns,
        format,
        baseFileName: `inventory_${selectedInventoryId.slice(0, 8)}_report`,
      });

      pushToast({ title: 'Отчет по инвентаризации выгружен', tone: 'success' });
    } catch (error) {
      const message = getApiErrorMessage(error);
      pushToast({
        title: 'Не удалось сформировать отчет',
        description: message,
        tone: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card title="Отчеты">
      <div className="grid gap-3 md:grid-cols-3">
        <Select
          value={reportType}
          onChange={(event) => setReportType(event.target.value as ReportType)}
        >
          <option value="equipment">Оборудование</option>
          <option value="inventory-records">Проведенная инвентаризация</option>
        </Select>

        <Select
          value={format}
          onChange={(event) => setFormat(event.target.value as ExportFormat)}
        >
          <option value="xlsx">XLSX</option>
          <option value="csv">CSV</option>
        </Select>

        <Button onClick={() => void handleExport()} disabled={isExporting}>
          {isExporting ? 'Формируем отчет...' : 'Скачать отчет'}
        </Button>
      </div>

      {reportType === 'equipment' ? (
        <section className="mt-4 rounded-md border border-gray-200 p-3">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Фильтры по оборудованию
          </h3>
          <div className="grid gap-2 md:grid-cols-4">
            <Input
              placeholder="Поиск по названию/номеру"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <Select
              value={statusId ?? ''}
              onChange={(event) =>
                setStatusId(
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
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
              onChange={(event) =>
                setTypeId(
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
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
              onChange={(event) =>
                setLocationId(
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
            >
              <option value="">Все локации</option>
              {locationsQuery.data?.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </Select>
          </div>
        </section>
      ) : (
        <section className="mt-4 rounded-md border border-gray-200 p-3">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Параметры отчета по инвентаризации
          </h3>
          <div className="grid gap-2 md:grid-cols-3">
            <Select
              value={selectedInventoryId}
              onChange={(event) => setSelectedInventoryId(event.target.value)}
            >
              <option value="">Выберите инвентаризацию</option>
              {closedInventories.map((inventory) => (
                <option key={inventory.id} value={inventory.id}>
                  {new Date(inventory.startedAt).toLocaleString()} •{' '}
                  {toInventoryStatusLabel(inventory.status)} •{' '}
                  {inventory.createdByUser?.fullName ?? '-'}
                </option>
              ))}
            </Select>

            <Select
              value={recordsResultStatus}
              onChange={(event) =>
                setRecordsResultStatus(
                  event.target.value as 'FOUND' | 'DAMAGED' | '',
                )
              }
            >
              <option value="">Любой результат</option>
              <option value="FOUND">Найдено</option>
              <option value="DAMAGED">Повреждено</option>
            </Select>

            <Input
              placeholder="Поиск по инв. номеру/названию"
              value={recordsSearch}
              onChange={(event) => setRecordsSearch(event.target.value)}
            />
          </div>
        </section>
      )}

      <section className="mt-4 rounded-md border border-gray-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Столбцы для выгрузки
          </h3>
          {reportType === 'equipment' ? (
            <Button variant="secondary" onClick={selectAllEquipmentColumns}>
              Выбрать все
            </Button>
          ) : (
            <Button variant="secondary" onClick={selectAllRecordColumns}>
              Выбрать все
            </Button>
          )}
        </div>

        {reportType === 'equipment' ? (
          <div className="grid gap-2 md:grid-cols-2">
            {equipmentColumns.map((column) => (
              <label
                key={column.key}
                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedEquipmentColumns.includes(column.key)}
                  onChange={() => toggleEquipmentColumn(column.key)}
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {inventoryRecordColumns.map((column) => (
              <label
                key={column.key}
                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedRecordColumns.includes(column.key)}
                  onChange={() => toggleRecordColumn(column.key)}
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      {reportType === 'equipment' ? (
        <section className="mt-4 rounded-md border border-gray-200 p-3">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Предпросмотр оборудования ({equipmentPreviewQuery.data?.length ?? 0})
          </h3>
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="w-full min-w-[980px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={
                        (equipmentPreviewQuery.data?.length ?? 0) > 0 &&
                        selectedEquipmentIds.length ===
                          (equipmentPreviewQuery.data?.length ?? 0)
                      }
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedEquipmentIds(
                            equipmentPreviewQuery.data?.map((item) => item.id) ??
                              [],
                          );
                        } else {
                          setSelectedEquipmentIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-3 py-2">Инв. номер</th>
                  <th className="px-3 py-2">Наименование</th>
                  <th className="px-3 py-2">Серийный номер</th>
                  <th className="px-3 py-2">Статус</th>
                  <th className="px-3 py-2">Тип</th>
                  <th className="px-3 py-2">Локация</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {equipmentPreviewQuery.data?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedEquipmentIds.includes(item.id)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedEquipmentIds((previous) => [
                              ...previous,
                              item.id,
                            ]);
                          } else {
                            setSelectedEquipmentIds((previous) =>
                              previous.filter((id) => id !== item.id),
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">{item.inventoryNumber}</td>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">{item.serialNumber ?? '-'}</td>
                    <td className="px-3 py-2">{item.status?.name ?? '-'}</td>
                    <td className="px-3 py-2">{item.type?.name ?? '-'}</td>
                    <td className="px-3 py-2">{item.location?.name ?? '-'}</td>
                  </tr>
                ))}
                {!equipmentPreviewQuery.isLoading &&
                !equipmentPreviewQuery.data?.length ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-3 text-center text-gray-500"
                    >
                      Ничего не найдено
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="mt-4 rounded-md border border-gray-200 p-3">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Предпросмотр записей инвентаризации (
            {inventoryRecordsPreviewQuery.data?.length ?? 0})
          </h3>
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="w-full min-w-[980px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2">Инв. номер</th>
                  <th className="px-3 py-2">Наименование</th>
                  <th className="px-3 py-2">Серийный номер</th>
                  <th className="px-3 py-2">Статус оборудования</th>
                  <th className="px-3 py-2">Тип</th>
                  <th className="px-3 py-2">Локация</th>
                  <th className="px-3 py-2">Результат</th>
                  <th className="px-3 py-2">Комментарий</th>
                  <th className="px-3 py-2">Сканировано</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {inventoryRecordsPreviewQuery.data?.map((record) => (
                  <tr key={record.id}>
                    <td className="px-3 py-2">
                      {record.equipment?.inventoryNumber ?? '-'}
                    </td>
                    <td className="px-3 py-2">{record.equipment?.name ?? '-'}</td>
                    <td className="px-3 py-2">
                      {record.equipment?.serialNumber ?? '-'}
                    </td>
                    <td className="px-3 py-2">
                      {record.equipment?.status?.name ?? '-'}
                    </td>
                    <td className="px-3 py-2">
                      {record.equipment?.type?.name ?? '-'}
                    </td>
                    <td className="px-3 py-2">
                      {record.equipment?.location?.name ?? '-'}
                    </td>
                    <td className="px-3 py-2">
                      {toResultStatusLabel(record.resultStatus)}
                    </td>
                    <td className="px-3 py-2">{record.comment ?? '-'}</td>
                    <td className="px-3 py-2">{toDateTime(record.scannedAt)}</td>
                  </tr>
                ))}
                {!inventoryRecordsPreviewQuery.isLoading &&
                !inventoryRecordsPreviewQuery.data?.length ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-3 text-center text-gray-500"
                    >
                      Записи не найдены
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </Card>
  );
}
