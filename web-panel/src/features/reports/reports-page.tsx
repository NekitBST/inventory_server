import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../app/toast-provider';
import { getApiErrorMessage } from '../../lib/api-error';
import {
  exportReportFile,
  type ExportStatisticsSheet,
} from '../../lib/report-export';
import { useAuth } from '../auth/useAuth';
import { equipmentApi } from '../equipment/api';
import { inventoriesApi } from '../inventories/api';
import { reportsApi } from './api';
import { referencesApi } from '../references/api';
import type {
  Equipment,
  InventoryRecord,
  ReportHistoryItem,
} from '../../types/entities';

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

type EquipmentReportSnapshot = {
  reportType: 'equipment';
  format: ExportFormat;
  includeStatistics: boolean;
  search: string;
  statusId?: number;
  typeId?: number;
  locationId?: number;
  selectedEquipmentIds: string[];
  selectedEquipmentColumns: EquipmentColumnKey[];
};

type InventoryRecordsReportSnapshot = {
  reportType: 'inventory-records';
  format: ExportFormat;
  includeStatistics: boolean;
  selectedInventoryId: string;
  recordsResultStatus: 'FOUND' | 'DAMAGED' | '';
  recordsSearch: string;
  selectedRecordColumns: InventoryRecordColumnKey[];
};

type ReportSnapshot = EquipmentReportSnapshot | InventoryRecordsReportSnapshot;

const REPORTS_STATE_STORAGE_KEY = 'reports.page.state.v1';

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

type PersistedReportsState = {
  reportType: ReportType;
  format: ExportFormat;
  includeStatistics: boolean;
  search: string;
  statusId: number | null;
  typeId: number | null;
  locationId: number | null;
  selectedInventoryId: string;
  recordsResultStatus: 'FOUND' | 'DAMAGED' | '';
  recordsSearch: string;
  selectedEquipmentColumns: EquipmentColumnKey[];
  selectedRecordColumns: InventoryRecordColumnKey[];
};

const equipmentColumnKeys = new Set<EquipmentColumnKey>(
  equipmentColumns.map((column) => column.key),
);

const inventoryRecordColumnKeys = new Set<InventoryRecordColumnKey>(
  inventoryRecordColumns.map((column) => column.key),
);

function readReportsState(): PersistedReportsState {
  const fallback: PersistedReportsState = {
    reportType: 'equipment',
    format: 'xlsx',
    includeStatistics: false,
    search: '',
    statusId: null,
    typeId: null,
    locationId: null,
    selectedInventoryId: '',
    recordsResultStatus: '',
    recordsSearch: '',
    selectedEquipmentColumns: equipmentColumns.map((column) => column.key),
    selectedRecordColumns: inventoryRecordColumns.map((column) => column.key),
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(REPORTS_STATE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedReportsState>;

    return {
      reportType:
        parsed.reportType === 'inventory-records'
          ? 'inventory-records'
          : 'equipment',
      format: parsed.format === 'csv' ? 'csv' : 'xlsx',
      includeStatistics: Boolean(parsed.includeStatistics),
      search: typeof parsed.search === 'string' ? parsed.search : '',
      statusId: typeof parsed.statusId === 'number' ? parsed.statusId : null,
      typeId: typeof parsed.typeId === 'number' ? parsed.typeId : null,
      locationId:
        typeof parsed.locationId === 'number' ? parsed.locationId : null,
      selectedInventoryId:
        typeof parsed.selectedInventoryId === 'string'
          ? parsed.selectedInventoryId
          : '',
      recordsResultStatus:
        parsed.recordsResultStatus === 'FOUND' ||
        parsed.recordsResultStatus === 'DAMAGED'
          ? parsed.recordsResultStatus
          : '',
      recordsSearch:
        typeof parsed.recordsSearch === 'string' ? parsed.recordsSearch : '',
      selectedEquipmentColumns: Array.isArray(parsed.selectedEquipmentColumns)
        ? parsed.selectedEquipmentColumns.filter(
            (key): key is EquipmentColumnKey =>
              typeof key === 'string' &&
              equipmentColumnKeys.has(key as EquipmentColumnKey),
          )
        : fallback.selectedEquipmentColumns,
      selectedRecordColumns: Array.isArray(parsed.selectedRecordColumns)
        ? parsed.selectedRecordColumns.filter(
            (key): key is InventoryRecordColumnKey =>
              typeof key === 'string' &&
              inventoryRecordColumnKeys.has(key as InventoryRecordColumnKey),
          )
        : fallback.selectedRecordColumns,
    };
  } catch {
    return fallback;
  }
}

function saveReportsState(state: PersistedReportsState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REPORTS_STATE_STORAGE_KEY, JSON.stringify(state));
}

function toDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function toResultStatusLabel(value: 'FOUND' | 'DAMAGED'): string {
  return value === 'FOUND' ? 'Найдено' : 'Повреждено';
}

function toInventoryStatusLabel(value: 'OPEN' | 'CLOSED'): string {
  return value === 'OPEN' ? 'Открытая' : 'Закрытая';
}

function toShortId(value: string): string {
  return value.slice(0, 8);
}

function toHistoryTitleLabel(title: string): string {
  if (title.startsWith('Оборудование')) {
    return 'Оборудование';
  }

  if (title.startsWith('Инвентаризация')) {
    return 'Инвентаризация';
  }

  return title.split('•')[0]?.trim() || title;
}

function toHistoryMetaLabel(item: ReportHistoryItem): string {
  const createdAt = new Date(item.createdAt).toLocaleString();
  const format = item.format.toUpperCase();

  if (item.reportType !== 'inventory-records') {
    return `${createdAt} • ${format}`;
  }

  const selectedInventoryId = item.snapshot['selectedInventoryId'];
  const shortId =
    typeof selectedInventoryId === 'string' && selectedInventoryId.length >= 8
      ? selectedInventoryId.slice(0, 8)
      : '--------';

  return `Id: ${shortId} • ${createdAt} • ${format}`;
}

function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function buildEquipmentStatistics(
  rows: EquipmentReportRow[],
): ExportStatisticsSheet | undefined {
  if (!rows.length) return undefined;

  const statuses = uniqueInOrder(
    rows.map((row) => row.statusName.trim()).filter(Boolean),
  );
  const locations = uniqueInOrder(
    rows.map((row) => row.locationName.trim()).filter(Boolean),
  );

  const tables: ExportStatisticsSheet['tables'] = [];

  if (locations.length > 0 && statuses.length > 0) {
    const locationRows = locations.map((location) => [
      location,
      ...statuses.map(
        (status) =>
          rows.filter(
            (row) =>
              row.locationName.trim() === location &&
              row.statusName.trim() === status,
          ).length,
      ),
    ]);

    const totalRow: Array<string | number | null> = [
      'Всего',
      ...statuses.map((_, statusIndex) =>
        locationRows.reduce((sum, row) => {
          const value = row[statusIndex + 1];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0),
      ),
    ];

    tables.push({
      title: 'По локациям',
      columns: ['Локация', ...statuses],
      rows: locations.length > 1 ? [...locationRows, totalRow] : locationRows,
    });
  }

  const rowsWithoutLocation = rows.filter((row) => !row.locationName.trim());
  if (rowsWithoutLocation.length > 0 && statuses.length > 0) {
    tables.push({
      title: 'Оборудование без указанной локации',
      columns: statuses,
      rows: [
        statuses.map(
          (status) =>
            rowsWithoutLocation.filter(
              (row) => row.statusName.trim() === status,
            ).length,
        ),
      ],
    });
  }

  return tables.length ? { sheetName: 'Статистика', tables } : undefined;
}

function buildInventoryStatistics(
  rows: InventoryRecordsReportRow[],
): ExportStatisticsSheet | undefined {
  if (!rows.length) return undefined;

  const resultStatuses = uniqueInOrder(
    rows.map((row) => row.resultStatus.trim()).filter(Boolean),
  );
  const equipmentStatuses = uniqueInOrder(
    rows.map((row) => row.equipmentStatus.trim()).filter(Boolean),
  );
  const locations = uniqueInOrder(
    rows.map((row) => row.locationName.trim()).filter(Boolean),
  );

  const tables: ExportStatisticsSheet['tables'] = [];

  if (resultStatuses.length > 0) {
    tables.push({
      title: 'Результаты сканирования',
      columns: resultStatuses,
      rows: [
        resultStatuses.map(
          (resultStatus) =>
            rows.filter((row) => row.resultStatus.trim() === resultStatus)
              .length,
        ),
      ],
    });
  }

  if (locations.length > 0 && equipmentStatuses.length > 0) {
    const locationRows = locations.map((location) => [
      location,
      ...equipmentStatuses.map(
        (status) =>
          rows.filter(
            (row) =>
              row.locationName.trim() === location &&
              row.equipmentStatus.trim() === status,
          ).length,
      ),
    ]);

    const totalRow: Array<string | number | null> = [
      'Всего',
      ...equipmentStatuses.map((_, statusIndex) =>
        locationRows.reduce((sum, row) => {
          const value = row[statusIndex + 1];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0),
      ),
    ];

    tables.push({
      title: 'По локациям',
      columns: ['Локация', ...equipmentStatuses],
      rows: locations.length > 1 ? [...locationRows, totalRow] : locationRows,
    });
  }

  const rowsWithoutLocation = rows.filter((row) => !row.locationName.trim());
  if (rowsWithoutLocation.length > 0 && equipmentStatuses.length > 0) {
    tables.push({
      title: 'Оборудование без указанной локации',
      columns: equipmentStatuses,
      rows: [
        equipmentStatuses.map(
          (status) =>
            rowsWithoutLocation.filter(
              (row) => row.equipmentStatus.trim() === status,
            ).length,
        ),
      ],
    });
  }

  return tables.length ? { sheetName: 'Статистика', tables } : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function isEquipmentSnapshot(
  snapshot: ReportSnapshot,
): snapshot is EquipmentReportSnapshot {
  return snapshot.reportType === 'equipment';
}

function isInventorySnapshot(
  snapshot: ReportSnapshot,
): snapshot is InventoryRecordsReportSnapshot {
  return snapshot.reportType === 'inventory-records';
}

type ReportHistoryModalProps = {
  isOpen: boolean;
  items: ReportHistoryItem[];
  isLoading: boolean;
  isPinning: boolean;
  onClose: () => void;
  onApply: (item: ReportHistoryItem) => void;
  onTogglePin: (item: ReportHistoryItem) => void;
};

function ReportHistoryModal({
  isOpen,
  items,
  isLoading,
  isPinning,
  onClose,
  onApply,
  onTogglePin,
}: ReportHistoryModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
      <section className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              История отчетов
            </h3>
            <p className="text-sm text-slate-500">
              Нажмите на запись, чтобы восстановить параметры отчета.
            </p>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-auto rounded-lg border border-slate-200">
          {isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Загружаем историю...
            </div>
          ) : items.length ? (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onApply(item)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {toHistoryTitleLabel(item.title)}
                      </span>
                      {item.isPinned ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          Закреплено
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {toHistoryMetaLabel(item)}
                    </p>
                  </button>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => onTogglePin(item)}
                      disabled={isPinning}
                    >
                      {item.isPinned ? 'Открепить' : 'Закрепить'}
                    </Button>
                    <Button onClick={() => onApply(item)}>Применить</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              История пока пуста.
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
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
  const initialReportsState = useMemo(() => readReportsState(), []);
  const { user } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState<ReportType>(
    initialReportsState.reportType,
  );
  const [format, setFormat] = useState<ExportFormat>(
    initialReportsState.format,
  );
  const [includeStatistics, setIncludeStatistics] = useState(
    initialReportsState.includeStatistics,
  );
  const [isExporting, setIsExporting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [search, setSearch] = useState(initialReportsState.search);
  const [statusId, setStatusId] = useState<number | undefined>(
    initialReportsState.statusId ?? undefined,
  );
  const [typeId, setTypeId] = useState<number | undefined>(
    initialReportsState.typeId ?? undefined,
  );
  const [locationId, setLocationId] = useState<number | undefined>(
    initialReportsState.locationId ?? undefined,
  );
  const [equipmentSelectionMode, setEquipmentSelectionMode] = useState<
    'auto' | 'manual'
  >('auto');

  const [selectedInventoryId, setSelectedInventoryId] = useState(
    initialReportsState.selectedInventoryId,
  );
  const [recordsResultStatus, setRecordsResultStatus] = useState<
    'FOUND' | 'DAMAGED' | ''
  >(initialReportsState.recordsResultStatus);
  const [recordsSearch, setRecordsSearch] = useState(
    initialReportsState.recordsSearch,
  );
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    [],
  );

  const [selectedEquipmentColumns, setSelectedEquipmentColumns] = useState<
    EquipmentColumnKey[]
  >(
    initialReportsState.selectedEquipmentColumns.length
      ? initialReportsState.selectedEquipmentColumns
      : equipmentColumns.map((column) => column.key),
  );

  const [selectedRecordColumns, setSelectedRecordColumns] = useState<
    InventoryRecordColumnKey[]
  >(
    initialReportsState.selectedRecordColumns.length
      ? initialReportsState.selectedRecordColumns
      : inventoryRecordColumns.map((column) => column.key),
  );

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

  const historyQuery = useQuery({
    queryKey: ['reports', 'history', reportType],
    queryFn: () => reportsApi.getHistory({ reportType }),
    enabled: isHistoryOpen && Boolean(user),
  });

  const closedInventories = useMemo(
    () =>
      inventoriesQuery.data?.items.filter(
        (inventory) => inventory.status === 'CLOSED',
      ) ?? [],
    [inventoriesQuery.data?.items],
  );

  useEffect(() => {
    if (reportType !== 'equipment' || equipmentSelectionMode !== 'auto') return;
    const ids = equipmentPreviewQuery.data?.map((item) => item.id) ?? [];
    setSelectedEquipmentIds(ids);
  }, [equipmentPreviewQuery.data, equipmentSelectionMode, reportType]);

  useEffect(() => {
    if (reportType === 'equipment') return;
    setEquipmentSelectionMode('auto');
  }, [reportType]);

  useEffect(() => {
    saveReportsState({
      reportType,
      format,
      includeStatistics,
      search,
      statusId: statusId ?? null,
      typeId: typeId ?? null,
      locationId: locationId ?? null,
      selectedInventoryId,
      recordsResultStatus,
      recordsSearch,
      selectedEquipmentColumns,
      selectedRecordColumns,
    });
  }, [
    reportType,
    format,
    includeStatistics,
    search,
    statusId,
    typeId,
    locationId,
    selectedInventoryId,
    recordsResultStatus,
    recordsSearch,
    selectedEquipmentColumns,
    selectedRecordColumns,
  ]);

  const selectedColumnsCount = useMemo(() => {
    return reportType === 'equipment'
      ? selectedEquipmentColumns.length
      : selectedRecordColumns.length;
  }, [
    reportType,
    selectedEquipmentColumns.length,
    selectedRecordColumns.length,
  ]);

  const rowsSelectedForExport = useMemo(() => {
    if (reportType === 'equipment') {
      return selectedEquipmentIds.length;
    }
    return inventoryRecordsPreviewQuery.data?.length ?? 0;
  }, [
    reportType,
    selectedEquipmentIds.length,
    inventoryRecordsPreviewQuery.data?.length,
  ]);

  const rowsInPreview = useMemo(() => {
    if (reportType === 'equipment') {
      return equipmentPreviewQuery.data?.length ?? 0;
    }
    return inventoryRecordsPreviewQuery.data?.length ?? 0;
  }, [
    reportType,
    equipmentPreviewQuery.data?.length,
    inventoryRecordsPreviewQuery.data?.length,
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

  const applyHistoryItem = (item: ReportHistoryItem) => {
    const snapshot = item.snapshot as ReportSnapshot;

    setReportType(item.reportType);
    setFormat(item.format);

    if (isEquipmentSnapshot(snapshot)) {
      const selectedEquipmentColumns = toStringArray(
        snapshot.selectedEquipmentColumns,
      ) as EquipmentColumnKey[];
      setSearch(snapshot.search ?? '');
      setStatusId(toNumber(snapshot.statusId));
      setTypeId(toNumber(snapshot.typeId));
      setLocationId(toNumber(snapshot.locationId));
      setSelectedEquipmentColumns(
        selectedEquipmentColumns.length
          ? selectedEquipmentColumns
          : equipmentColumns.map((column) => column.key),
      );
      setSelectedEquipmentIds(toStringArray(snapshot.selectedEquipmentIds));
      setIncludeStatistics(Boolean(snapshot.includeStatistics));
      setEquipmentSelectionMode('manual');
    } else if (isInventorySnapshot(snapshot)) {
      const selectedRecordColumns = toStringArray(
        snapshot.selectedRecordColumns,
      ) as InventoryRecordColumnKey[];
      setSelectedInventoryId(snapshot.selectedInventoryId);
      setRecordsResultStatus(snapshot.recordsResultStatus);
      setRecordsSearch(snapshot.recordsSearch);
      setSelectedRecordColumns(
        selectedRecordColumns.length
          ? selectedRecordColumns
          : inventoryRecordColumns.map((column) => column.key),
      );
      setIncludeStatistics(Boolean(snapshot.includeStatistics));
    }

    setIsHistoryOpen(false);
  };

  const handleToggleHistoryPin = async (item: ReportHistoryItem) => {
    try {
      await reportsApi.setHistoryPinned(item.id, { isPinned: !item.isPinned });
      await queryClient.invalidateQueries({ queryKey: ['reports', 'history'] });
    } catch (error) {
      pushToast({
        title: 'Не удалось обновить историю',
        description: getApiErrorMessage(error),
        tone: 'error',
      });
    }
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

        const statistics = includeStatistics
          ? buildEquipmentStatistics(rows)
          : undefined;

        await exportReportFile<EquipmentReportRow>({
          rows,
          columns: equipmentColumns,
          selectedColumnKeys: selectedEquipmentColumns,
          format,
          baseFileName: 'equipment_report',
          statistics,
        });

        const snapshot: EquipmentReportSnapshot = {
          reportType: 'equipment',
          format,
          includeStatistics,
          search,
          statusId,
          typeId,
          locationId,
          selectedEquipmentIds,
          selectedEquipmentColumns,
        };

        try {
          await reportsApi.createHistory({
            reportType: 'equipment',
            format,
            snapshot,
          });
          await queryClient.invalidateQueries({
            queryKey: ['reports', 'history'],
          });
        } catch (historyError) {
          pushToast({
            title: 'Отчет выгружен, но историю не удалось сохранить',
            description: getApiErrorMessage(historyError),
            tone: 'warning',
          });
        }

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

      const statistics = includeStatistics
        ? buildInventoryStatistics(rows)
        : undefined;

      await exportReportFile<InventoryRecordsReportRow>({
        rows,
        columns: inventoryRecordColumns,
        selectedColumnKeys: selectedRecordColumns,
        format,
        baseFileName: `inventory_${selectedInventoryId.slice(0, 8)}_report`,
        statistics,
      });

      const snapshot: InventoryRecordsReportSnapshot = {
        reportType: 'inventory-records',
        format,
        includeStatistics,
        selectedInventoryId,
        recordsResultStatus,
        recordsSearch,
        selectedRecordColumns,
      };

      try {
        await reportsApi.createHistory({
          reportType: 'inventory-records',
          format,
          snapshot,
        });
        await queryClient.invalidateQueries({
          queryKey: ['reports', 'history'],
        });
      } catch (historyError) {
        pushToast({
          title: 'Отчет выгружен, но историю не удалось сохранить',
          description: getApiErrorMessage(historyError),
          tone: 'warning',
        });
      }

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
      <div className="grid gap-3 md:grid-cols-5">
        <Select
          value={reportType}
          onChange={(event) => {
            const nextReportType = event.target.value as ReportType;
            setReportType(nextReportType);
            if (nextReportType === 'equipment') {
              setEquipmentSelectionMode('auto');
            }
          }}
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

        <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={includeStatistics}
            onChange={(event) => setIncludeStatistics(event.target.checked)}
          />
          <span>Подсчёт статистики</span>
        </label>

        <Button
          className="w-full"
          onClick={() => void handleExport()}
          disabled={isExporting}
        >
          {isExporting ? 'Формируем отчет...' : 'Скачать отчет'}
        </Button>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setIsHistoryOpen(true)}
        >
          История отчетов
        </Button>
      </div>

      <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        Предпросмотр: {rowsInPreview} строк • к экспорту выбрано:{' '}
        {rowsSelectedForExport} строк
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
              onChange={(event) => {
                setEquipmentSelectionMode('auto');
                setSearch(event.target.value);
              }}
            />

            <Select
              value={statusId ?? ''}
              onChange={(event) => {
                setEquipmentSelectionMode('auto');
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
                setEquipmentSelectionMode('auto');
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
                setEquipmentSelectionMode('auto');
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
        </section>
      ) : (
        <section className="mt-4 rounded-md border border-gray-200 p-3">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Параметры отчета по инвентаризации
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            <Select
              value={selectedInventoryId}
              onChange={(event) => setSelectedInventoryId(event.target.value)}
              className="md:col-span-2"
            >
              <option value="">Выберите инвентаризацию</option>
              {closedInventories.map((inventory) => (
                <option key={inventory.id} value={inventory.id}>
                  {`Id: ${toShortId(inventory.id)} • ${new Date(inventory.startedAt).toLocaleString()} • ${toInventoryStatusLabel(inventory.status)} • ${inventory.createdByUser?.fullName ?? '-'}`}
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
            Предпросмотр оборудования ({equipmentPreviewQuery.data?.length ?? 0}
            )
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
                          setEquipmentSelectionMode('manual');
                          setSelectedEquipmentIds(
                            equipmentPreviewQuery.data?.map(
                              (item) => item.id,
                            ) ?? [],
                          );
                        } else {
                          setEquipmentSelectionMode('manual');
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
                            setEquipmentSelectionMode('manual');
                            setSelectedEquipmentIds((previous) => [
                              ...previous,
                              item.id,
                            ]);
                          } else {
                            setEquipmentSelectionMode('manual');
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
                    <td className="px-3 py-2">
                      {record.equipment?.name ?? '-'}
                    </td>
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
                    <td className="px-3 py-2">
                      {toDateTime(record.scannedAt)}
                    </td>
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

      <ReportHistoryModal
        isOpen={isHistoryOpen}
        items={historyQuery.data ?? []}
        isLoading={historyQuery.isLoading}
        isPinning={false}
        onClose={() => setIsHistoryOpen(false)}
        onApply={applyHistoryItem}
        onTogglePin={handleToggleHistoryPin}
      />
    </Card>
  );
}
