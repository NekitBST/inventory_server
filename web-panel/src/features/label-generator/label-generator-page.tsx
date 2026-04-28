import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../app/toast-provider';
import { readPageLimit, savePageLimit } from '../../lib/page-limit-storage';
import { equipmentApi } from '../equipment/api';
import { referencesApi } from '../references/api';
import type { Equipment } from '../../types/entities';
import { LabelPreview } from './LabelPreview';
import { LabelSettings } from './LabelSettings';
import {
  DEFAULT_LABEL_SIZE,
  type LabelItem,
  type LabelPrintMode,
  type LabelSize,
  type LabelSourceMode,
} from './types';
import {
  downloadLabelPdf,
  equipmentToLabelItem,
  parseLabelWorkbook,
} from './utils';

const equipmentColumns = [
  { key: 'inventoryNumber', label: 'Инвентарный номер' },
  { key: 'name', label: 'Наименование' },
  { key: 'serialNumber', label: 'Серийный номер' },
] as const;

const LABEL_GENERATOR_STORAGE_KEY = 'label-generator.settings';

type LabelGeneratorStoredState = {
  sourceMode: LabelSourceMode;
  printMode: LabelPrintMode;
  size: LabelSize;
  limit: number;
  search: string;
  statusId: number | null;
  typeId: number | null;
  locationId: number | null;
  selectedEquipmentIds: string[];
  selectedEquipmentMap: Record<string, LabelItem>;
  fileIndex: number;
  equipmentPreviewIndex: number;
  fileName: string;
};

function readStoredLabelGeneratorState(): LabelGeneratorStoredState | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(LABEL_GENERATOR_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<LabelGeneratorStoredState>;

    return {
      sourceMode: parsed.sourceMode === 'database' ? 'database' : 'file',
      printMode: parsed.printMode === 'a4' ? 'a4' : 'single',
      size: {
        ...DEFAULT_LABEL_SIZE,
        ...(parsed.size ?? {}),
      },
      limit:
        typeof parsed.limit === 'number' && parsed.limit > 0
          ? parsed.limit
          : 20,
      search: parsed.search ?? '',
      statusId: typeof parsed.statusId === 'number' ? parsed.statusId : null,
      typeId: typeof parsed.typeId === 'number' ? parsed.typeId : null,
      locationId:
        typeof parsed.locationId === 'number' ? parsed.locationId : null,
      selectedEquipmentIds: Array.isArray(parsed.selectedEquipmentIds)
        ? parsed.selectedEquipmentIds.filter(
            (value): value is string => typeof value === 'string',
          )
        : [],
      selectedEquipmentMap:
        parsed.selectedEquipmentMap &&
        typeof parsed.selectedEquipmentMap === 'object'
          ? parsed.selectedEquipmentMap
          : {},
      fileIndex:
        typeof parsed.fileIndex === 'number' && parsed.fileIndex >= 0
          ? parsed.fileIndex
          : 0,
      equipmentPreviewIndex:
        typeof parsed.equipmentPreviewIndex === 'number' &&
        parsed.equipmentPreviewIndex >= 0
          ? parsed.equipmentPreviewIndex
          : 0,
      fileName: parsed.fileName ?? '',
    };
  } catch {
    return null;
  }
}

function saveStoredLabelGeneratorState(state: LabelGeneratorStoredState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    LABEL_GENERATOR_STORAGE_KEY,
    JSON.stringify(state),
  );
}

function toLabelName(item: LabelItem): string {
  return item.name.trim() || 'Не указано';
}

function formatFileName(name: string): string {
  return name.replace(/\.[^.]+$/, '').trim();
}

function LabelFileUpload({
  onFileSelect,
  disabled = false,
}: {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = event.currentTarget.files?.[0];
    if (file) {
      onFileSelect(file);
      event.currentTarget.value = '';
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <label
      className={[
        'flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition',
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-60'
          : dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400',
      ].join(' ')}
      onDragEnter={() => setDragActive(true)}
      onDragLeave={() => setDragActive(false)}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        disabled={disabled}
        onChange={handleFileChange}
      />
      <svg
        className="mb-4 h-8 w-8 text-slate-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <p className="text-base font-semibold text-gray-900">
        Перетащите файл сюда
      </p>
      <p className="mt-1 text-sm text-gray-600">или нажмите для выбора</p>
      <p className="mt-3 text-xs text-gray-500">
        Поддерживаются файлы: .xlsx, .xls
      </p>
    </label>
  );
}

export function LabelGeneratorPage() {
  const { pushToast } = useToast();
  const [sourceMode, setSourceMode] = useState<LabelSourceMode>('file');
  const [printMode, setPrintMode] = useState<LabelPrintMode>('single');
  const [size, setSize] = useState<LabelSize>(DEFAULT_LABEL_SIZE);
  const [loading, setLoading] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [fileItems, setFileItems] = useState<LabelItem[]>([]);
  const [fileIndex, setFileIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() =>
    readPageLimit('label-generator.limit', 20),
  );
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState<number | undefined>();
  const [typeId, setTypeId] = useState<number | undefined>();
  const [locationId, setLocationId] = useState<number | undefined>();
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    [],
  );
  const [selectedEquipmentMap, setSelectedEquipmentMap] = useState<
    Record<string, LabelItem>
  >({});
  const [equipmentPreviewIndex, setEquipmentPreviewIndex] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const stored = readStoredLabelGeneratorState();

    if (stored) {
      setSourceMode(stored.sourceMode);
      setPrintMode(stored.printMode);
      setSize(stored.size);
      setLimit(stored.limit);
      setSearch(stored.search);
      setStatusId(stored.statusId ?? undefined);
      setTypeId(stored.typeId ?? undefined);
      setLocationId(stored.locationId ?? undefined);
      setSelectedEquipmentIds(stored.selectedEquipmentIds);
      setSelectedEquipmentMap(stored.selectedEquipmentMap);
      setFileIndex(stored.fileIndex);
      setEquipmentPreviewIndex(stored.equipmentPreviewIndex);
      setFileName(stored.fileName);
    }

    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;

    saveStoredLabelGeneratorState({
      sourceMode,
      printMode,
      size,
      limit,
      search,
      statusId: statusId ?? null,
      typeId: typeId ?? null,
      locationId: locationId ?? null,
      selectedEquipmentIds,
      selectedEquipmentMap,
      fileIndex,
      equipmentPreviewIndex,
      fileName,
    });
  }, [
    settingsLoaded,
    sourceMode,
    printMode,
    size,
    limit,
    search,
    statusId,
    typeId,
    locationId,
    selectedEquipmentIds,
    selectedEquipmentMap,
    fileIndex,
    equipmentPreviewIndex,
    fileName,
  ]);

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
    queryKey: ['label-generator-equipment', filters],
    queryFn: () => equipmentApi.getAll(filters),
    enabled: sourceMode === 'database',
  });

  const statusesQuery = useQuery({
    queryKey: ['label-generator-statuses'],
    queryFn: () => referencesApi.getAll('equipment-statuses'),
    enabled: sourceMode === 'database',
  });

  const typesQuery = useQuery({
    queryKey: ['label-generator-types'],
    queryFn: () => referencesApi.getAll('equipment-types'),
    enabled: sourceMode === 'database',
  });

  const locationsQuery = useQuery({
    queryKey: ['label-generator-locations'],
    queryFn: () => referencesApi.getAll('locations'),
    enabled: sourceMode === 'database',
  });

  useEffect(() => {
    savePageLimit('label-generator.limit', limit);
  }, [limit]);

  useEffect(() => {
    setPage(1);
  }, [search, statusId, typeId, locationId, limit]);

  useEffect(() => {
    if (sourceMode === 'file') {
      setFileIndex((current) =>
        Math.min(current, Math.max(fileItems.length - 1, 0)),
      );
    }
  }, [sourceMode, fileItems.length]);

  const equipmentItems = equipmentQuery.data?.items ?? [];
  const selectedEquipmentItems = selectedEquipmentIds
    .map((id) => selectedEquipmentMap[id])
    .filter((item): item is LabelItem => Boolean(item));

  const activeItems =
    sourceMode === 'file' ? fileItems : selectedEquipmentItems;

  useEffect(() => {
    if (sourceMode !== 'database') return;
    setEquipmentPreviewIndex((current) =>
      Math.min(current, Math.max(activeItems.length - 1, 0)),
    );
  }, [sourceMode, activeItems.length]);

  const previewItem =
    sourceMode === 'file'
      ? (fileItems[fileIndex] ?? null)
      : (activeItems[equipmentPreviewIndex] ?? activeItems[0] ?? null);

  const resetToDefaultSettings = () => {
    setSourceMode('file');
    setPrintMode('single');
    setSize(DEFAULT_LABEL_SIZE);
    setLimit(20);
    setSearch('');
    setStatusId(undefined);
    setTypeId(undefined);
    setLocationId(undefined);
    setSelectedEquipmentIds([]);
    setSelectedEquipmentMap({});
    setFileItems([]);
    setFileIndex(0);
    setFileName('');
    setEquipmentPreviewIndex(0);
    setPage(1);
    pushToast({
      title: 'Параметры сброшены к значениям по умолчанию',
      tone: 'info',
    });
  };

  const handleFileSelect = async (file: File) => {
    setLoading(true);

    try {
      const items = await parseLabelWorkbook(file);
      setSourceMode('file');
      setFileItems(items);
      setFileIndex(0);
      setFileName(file.name);
      pushToast({
        title: 'Файл загружен',
        description: `Найдено ${items.length} позиций`,
        tone: 'success',
      });
    } catch (submissionError) {
      setFileItems([]);
      setFileIndex(0);
      setFileName('');
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : 'Ошибка при обработке файла';
      pushToast({
        title: 'Не удалось загрузить файл',
        description: message,
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);

    try {
      const itemsToExport =
        sourceMode === 'file' ? fileItems : selectedEquipmentItems;

      if (!itemsToExport.length) {
        pushToast({
          title:
            sourceMode === 'file'
              ? 'Загрузите файл с оборудованием'
              : 'Выберите хотя бы одно оборудование в списке',
          tone: 'warning',
        });
        return;
      }

      const exportFileName =
        sourceMode === 'file'
          ? `этикетки_${formatFileName(fileName) || 'file'}`
          : 'этикетки_из_базы';

      await downloadLabelPdf(
        itemsToExport,
        size,
        printMode,
        `${exportFileName}.pdf`,
      );

      pushToast({
        title: 'Этикетки сгенерированы',
        tone: 'success',
      });
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : 'Ошибка при генерации PDF';
      pushToast({
        title: 'Не удалось создать PDF',
        description: message,
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEquipmentSelection = (equipment: Equipment, checked: boolean) => {
    const labelItem = equipmentToLabelItem(equipment);

    if (checked) {
      setSelectedEquipmentIds((previous) =>
        previous.includes(equipment.id)
          ? previous
          : [...previous, equipment.id],
      );
      setSelectedEquipmentMap((previous) => ({
        ...previous,
        [equipment.id]: labelItem,
      }));
      return;
    }

    setSelectedEquipmentIds((previous) =>
      previous.filter((id) => id !== equipment.id),
    );
    setSelectedEquipmentMap((previous) => {
      const next = { ...previous };
      delete next[equipment.id];
      return next;
    });
  };

  const toggleSelectAllOnPage = (checked: boolean) => {
    const nextIds = equipmentItems.map((item) => item.id);

    if (checked) {
      setSelectedEquipmentIds((previous) =>
        Array.from(new Set([...previous, ...nextIds])),
      );
      setSelectedEquipmentMap((previous) => {
        const next = { ...previous };
        equipmentItems.forEach((item) => {
          next[item.id] = equipmentToLabelItem(item);
        });
        return next;
      });
      return;
    }

    setSelectedEquipmentIds((previous) =>
      previous.filter((id) => !nextIds.includes(id)),
    );
    setSelectedEquipmentMap((previous) => {
      const next = { ...previous };
      nextIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  };

  const isAllPageSelected =
    equipmentItems.length > 0 &&
    equipmentItems.every((item) => selectedEquipmentIds.includes(item.id));

  const isSomePageSelected =
    equipmentItems.some((item) => selectedEquipmentIds.includes(item.id)) &&
    !isAllPageSelected;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            Генератор этикеток
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            для инвентаризации оборудования
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={resetToDefaultSettings}>
            Настройки по умолчанию
          </Button>
          <Button variant="secondary" onClick={() => setInstructionsOpen(true)}>
            Инструкция
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sourceMode === 'file' ? 'primary' : 'secondary'}
            onClick={() => setSourceMode('file')}
          >
            Загрузка из файла
          </Button>
          <Button
            variant={sourceMode === 'database' ? 'primary' : 'secondary'}
            onClick={() => setSourceMode('database')}
          >
            Загрузка из БД
          </Button>
        </div>
      </Card>

      {sourceMode === 'file' ? (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.38fr)_minmax(460px,0.62fr)]">
          <div className="min-w-0 space-y-6">
            {!fileItems.length ? (
              <Card title="Начните с загрузки">
                <LabelFileUpload
                  disabled={loading}
                  onFileSelect={handleFileSelect}
                />
              </Card>
            ) : (
              <Card>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Загружено
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                      {fileItems.length}{' '}
                      {fileItems.length === 1
                        ? 'позиция'
                        : fileItems.length < 5
                          ? 'позиции'
                          : 'позиций'}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">{fileName}</p>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => setFileItems([])}
                    disabled={loading}
                  >
                    Загрузить новый
                  </Button>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-600">
                  <p>
                    Файл должен содержать инвентарный номер. Если его нет,
                    строка не попадет в генерацию.
                  </p>
                </div>
              </Card>
            )}

            {fileItems.length ? (
              <Card title="Позиции из файла">
                <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-200">
                  <table className="min-w-[720px] text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2">№</th>
                        <th className="px-3 py-2">Наименование</th>
                        <th className="px-3 py-2">Инвентарный номер</th>
                        <th className="px-3 py-2">Серийный номер</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className={
                            fileIndex === index
                              ? 'bg-blue-50'
                              : 'border-t border-gray-100'
                          }
                          onClick={() => setFileIndex(index)}
                        >
                          <td className="px-3 py-2 font-medium text-gray-700">
                            {item.number}
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {item.name || 'Не указано'}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-900">
                            {item.inventoryNumber}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-700">
                            {item.serialNumber || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : null}
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Режим печати
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Термопринтер или печать на A4
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={printMode === 'single' ? 'primary' : 'secondary'}
                    onClick={() => setPrintMode('single')}
                  >
                    Термопринтер
                  </Button>
                  <Button
                    variant={printMode === 'a4' ? 'primary' : 'secondary'}
                    onClick={() => setPrintMode('a4')}
                  >
                    Печать на A4
                  </Button>
                </div>
              </div>

              <LabelSettings size={size} onChange={setSize} />
            </Card>

            <Card title="Предпросмотр" className="min-w-0">
              <div className="flex min-h-[460px] min-w-0 flex-col items-center justify-center gap-6 rounded-2xl bg-slate-50 p-6">
                <LabelPreview item={previewItem} size={size} />

                {previewItem ? (
                  <div className="w-full space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Наименование
                      </p>
                      <p className="mt-1 break-words text-2xl font-semibold text-gray-900">
                        {toLabelName(previewItem)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Инвентарный номер
                        </p>
                        <p className="mt-1 break-all font-mono text-gray-900">
                          {previewItem.inventoryNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Серийный номер
                        </p>
                        <p className="mt-1 break-all font-mono text-gray-900">
                          {previewItem.serialNumber || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setFileIndex((current) => Math.max(0, current - 1))
                        }
                        disabled={fileIndex === 0}
                      >
                        ← Назад
                      </Button>
                      <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900">
                        {fileItems.length
                          ? `${fileIndex + 1} / ${fileItems.length}`
                          : '0 / 0'}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setFileIndex((current) =>
                            Math.min(fileItems.length - 1, current + 1),
                          )
                        }
                        disabled={fileIndex === fileItems.length - 1}
                      >
                        Далее →
                      </Button>
                    </div>
                  </div>
                ) : null}

                <Button
                  className="w-full py-3"
                  onClick={() => void handleExport()}
                  disabled={loading}
                >
                  {loading ? 'Экспорт...' : 'Скачать PDF'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.38fr)_minmax(460px,0.62fr)]">
          <div className="min-w-0 space-y-6">
            <Card title="Фильтры оборудования">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Поиск
                  </label>
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Инвентарный номер, наименование или серийный номер"
                    className="max-w-[360px]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:col-span-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Статус
                    </label>
                    <Select
                      value={statusId ?? ''}
                      onChange={(event) =>
                        setStatusId(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      className="max-w-[190px]"
                    >
                      <option value="">Все статусы</option>
                      {statusesQuery.data?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Тип
                    </label>
                    <Select
                      value={typeId ?? ''}
                      onChange={(event) =>
                        setTypeId(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      className="max-w-[190px]"
                    >
                      <option value="">Все типы</option>
                      {typesQuery.data?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Локация
                    </label>
                    <Select
                      value={locationId ?? ''}
                      onChange={(event) =>
                        setLocationId(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined,
                        )
                      }
                      className="max-w-[190px]"
                    >
                      <option value="">Все локации</option>
                      {locationsQuery.data?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      На странице
                    </label>
                    <Select
                      value={limit}
                      onChange={(event) => setLimit(Number(event.target.value))}
                      className="max-w-[160px]"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={500}>500</option>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Выбор из БД
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedEquipmentIds.length
                      ? `Выбрано: ${selectedEquipmentIds.length}`
                      : 'Выберите оборудование чекбоксами'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={(element) => {
                      if (!element) return;
                      element.indeterminate = isSomePageSelected;
                    }}
                    onChange={(event) =>
                      toggleSelectAllOnPage(event.currentTarget.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-gray-900"
                  />
                  <span>Выбрать все на странице</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-[980px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Выбор</th>
                      {equipmentColumns.map((column) => (
                        <th key={column.key} className="px-3 py-2">
                          {column.label}
                        </th>
                      ))}
                      <th className="px-3 py-2">Статус</th>
                      <th className="px-3 py-2">Тип</th>
                      <th className="px-3 py-2">Локация</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentQuery.isLoading ? (
                      <tr>
                        <td
                          className="px-3 py-6 text-sm text-gray-500"
                          colSpan={7}
                        >
                          Загружаем оборудование...
                        </td>
                      </tr>
                    ) : equipmentItems.length > 0 ? (
                      equipmentItems.map((item, index) => {
                        const selected = selectedEquipmentIds.includes(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={
                              selected
                                ? 'bg-blue-50'
                                : index % 2 === 0
                                  ? 'bg-white'
                                  : 'bg-gray-50/40'
                            }
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(event) =>
                                  toggleEquipmentSelection(
                                    item,
                                    event.currentTarget.checked,
                                  )
                                }
                                className="h-4 w-4 rounded border-gray-300 text-gray-900"
                              />
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-900">
                              {item.inventoryNumber}
                            </td>
                            <td className="px-3 py-2 text-gray-900">
                              {item.name || 'Не указано'}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-700">
                              {item.serialNumber || '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {item.status?.name ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {item.type?.name ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {item.location?.name ?? '—'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          className="px-3 py-6 text-sm text-gray-500"
                          colSpan={7}
                        >
                          По выбранным фильтрам ничего не найдено.
                        </td>
                      </tr>
                    )}
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
          </div>

          <div className="min-w-0 space-y-6">
            <Card className="min-w-0 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Режим печати
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Термопринтер или печать на A4
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={printMode === 'single' ? 'primary' : 'secondary'}
                    onClick={() => setPrintMode('single')}
                  >
                    Термопринтер
                  </Button>
                  <Button
                    variant={printMode === 'a4' ? 'primary' : 'secondary'}
                    onClick={() => setPrintMode('a4')}
                  >
                    Печать на A4
                  </Button>
                </div>
              </div>

              <LabelSettings size={size} onChange={setSize} />
            </Card>

            <Card title="Предпросмотр" className="min-w-0">
              <div className="flex min-h-[460px] min-w-0 flex-col items-center justify-center gap-6 rounded-2xl bg-slate-50 p-6">
                <LabelPreview item={previewItem} size={size} />

                {previewItem ? (
                  <div className="w-full space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Наименование
                      </p>
                      <p className="mt-1 break-words text-2xl font-semibold text-gray-900">
                        {toLabelName(previewItem)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Инвентарный номер
                        </p>
                        <p className="mt-1 break-all font-mono text-gray-900">
                          {previewItem.inventoryNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Серийный номер
                        </p>
                        <p className="mt-1 break-all font-mono text-gray-900">
                          {previewItem.serialNumber || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setEquipmentPreviewIndex((current) =>
                            Math.max(0, current - 1),
                          )
                        }
                        disabled={equipmentPreviewIndex === 0}
                      >
                        ← Назад
                      </Button>
                      <div className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900">
                        {activeItems.length
                          ? `${equipmentPreviewIndex + 1} / ${activeItems.length}`
                          : '0 / 0'}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setEquipmentPreviewIndex((current) =>
                            Math.min(activeItems.length - 1, current + 1),
                          )
                        }
                        disabled={
                          equipmentPreviewIndex >= activeItems.length - 1
                        }
                      >
                        Далее →
                      </Button>
                    </div>
                  </div>
                ) : null}

                <Button
                  className="w-full py-3"
                  onClick={() => void handleExport()}
                  disabled={loading}
                >
                  {loading ? 'Экспорт...' : 'Скачать PDF'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {instructionsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Инструкция
                </h2>
                <Button
                  variant="secondary"
                  onClick={() => setInstructionsOpen(false)}
                >
                  Закрыть
                </Button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-6 py-5 text-sm text-gray-700">
              <div className="space-y-5">
                <section>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">
                    Загрузка из файла
                  </h3>
                  <p className="mb-2">
                    Загрузите Excel-файл формата .xlsx или .xls. Таблица может
                    содержать столбцы №, Наименование оборудования, Инвентарный
                    номер и Серийный номер.
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Главное поле для генерации — инвентарный номер.</li>
                    <li>
                      Если наименование пустое, в предпросмотре и PDF будет
                      показано «Не указано».
                    </li>
                    <li>
                      Если серийного номера нет, он просто не отображается.
                    </li>
                    <li>
                      Если в файле нет ни одного инвентарного номера, генерация
                      не запускается.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">
                    Загрузка из БД
                  </h3>
                  <p className="mb-2">
                    Переключитесь на вкладку загрузки из БД и отберите
                    оборудование через фильтры и чекбоксы. Выбранные позиции
                    попадут в экспорт PDF.
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Доступны те же фильтры, что и на странице оборудования.
                    </li>
                    <li>
                      Можно выбрать несколько позиций и экспортировать их одним
                      PDF.
                    </li>
                    <li>Для экспорта используются только отмеченные строки.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="mb-2 text-base font-semibold text-gray-900">
                    Режимы печати
                  </h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Термопринтер — каждая этикетка на отдельной странице.
                    </li>
                    <li>
                      Печать на A4 — несколько этикеток на одном листе по
                      текущему размеру.
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
