import ExcelJS from 'exceljs';
import { downloadBlob } from './download';

type ReportFormat = 'csv' | 'xlsx';

export type ExportStatisticsTable = {
  title: string;
  columns: string[];
  rows: Array<Array<string | number | null>>;
};

export type ExportStatisticsSheet = {
  sheetName?: string;
  tables: ExportStatisticsTable[];
};

type ExportColumn<T> = {
  key: keyof T;
  label: string;
};

function formatStamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}_${hours}${minutes}`;
}

export async function exportReportFile<T extends Record<string, unknown>>({
  rows,
  columns,
  selectedColumnKeys,
  format,
  baseFileName,
  statistics,
}: {
  rows: T[];
  columns: Array<ExportColumn<T>>;
  selectedColumnKeys: Array<keyof T>;
  format: ReportFormat;
  baseFileName: string;
  statistics?: ExportStatisticsSheet;
}): Promise<void> {
  const selectedColumns = columns.filter((column) =>
    selectedColumnKeys.includes(column.key),
  );

  const header = selectedColumns.map((column) => column.label);
  const bodyRows = rows.map((row) =>
    selectedColumns.map((column) => {
      const value = row[column.key];
      return value === null || value === undefined ? '' : String(value);
    }),
  );

  const toCsvCell = (value: string | number | null) => {
    const normalized =
      value === null || value === undefined ? '' : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  const stamp = formatStamp();

  if (format === 'csv') {
    const csvRows: Array<Array<string | number | null>> = [header, ...bodyRows];

    if (statistics?.tables.length) {
      csvRows.push([]);

      statistics.tables.forEach((table) => {
        csvRows.push([table.title]);
        if (table.columns.length > 0) {
          csvRows.push(table.columns);
        }
        csvRows.push(...table.rows);
        csvRows.push([]);
      });
    }

    const csv = csvRows.map((row) => row.map(toCsvCell).join(';')).join('\n');
    const fileName = `${baseFileName}_${stamp}.csv`;
    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8',
    });
    downloadBlob(blob, fileName);
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Отчет');

  worksheet.addRow(header);
  bodyRows.forEach((row) => worksheet.addRow(row));

  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF808080' } },
    left: { style: 'thin', color: { argb: 'FF808080' } },
    bottom: { style: 'thin', color: { argb: 'FF808080' } },
    right: { style: 'thin', color: { argb: 'FF808080' } },
  };

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = borderStyle;
      if (rowNumber === 1) {
        cell.font = { bold: true };
      }
    });
  });

  worksheet.columns.forEach((column, index) => {
    const headerLength = header[index]?.length ?? 0;
    let maxLen = headerLength;
    bodyRows.forEach((row) => {
      const len = (row[index] ?? '').length;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.min(Math.max(maxLen + 2, 12), 48);
  });

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  if (statistics?.tables.length) {
    const statisticsSheet = workbook.addWorksheet(
      statistics.sheetName ?? 'Статистика',
    );
    const statisticsBorderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF808080' } },
      left: { style: 'thin', color: { argb: 'FF808080' } },
      bottom: { style: 'thin', color: { argb: 'FF808080' } },
      right: { style: 'thin', color: { argb: 'FF808080' } },
    };
    const widths: number[] = [];

    const trackWidths = (values: Array<string | number | null>) => {
      values.forEach((value, index) => {
        const length =
          value === null || value === undefined ? 0 : String(value).length;
        widths[index] = Math.max(widths[index] ?? 0, length);
      });
    };

    statistics.tables.forEach((table) => {
      const titleRow = statisticsSheet.addRow([table.title]);
      const mergedColumns = Math.max(1, table.columns.length);
      if (mergedColumns > 1) {
        statisticsSheet.mergeCells(
          titleRow.number,
          1,
          titleRow.number,
          mergedColumns,
        );
      }

      const titleCell = statisticsSheet.getCell(titleRow.number, 1);
      titleCell.border = statisticsBorderStyle;
      titleCell.font = { bold: true };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDDEBFA' },
      };
      trackWidths([table.title]);

      if (table.columns.length > 0) {
        const headerRow = statisticsSheet.addRow(table.columns);
        headerRow.eachCell((cell) => {
          cell.border = statisticsBorderStyle;
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF4F7FB' },
          };
        });
        trackWidths(table.columns);
      }

      table.rows.forEach((rowValues) => {
        const row = statisticsSheet.addRow(rowValues);
        row.eachCell((cell) => {
          cell.border = statisticsBorderStyle;
        });
        trackWidths(rowValues);
      });

      statisticsSheet.addRow([]);
    });

    widths.forEach((width, index) => {
      statisticsSheet.getColumn(index + 1).width = Math.min(
        Math.max(width + 2, 12),
        48,
      );
    });
  }

  const binary = await workbook.xlsx.writeBuffer();
  const fileName = `${baseFileName}_${stamp}.xlsx`;
  const blob = new Blob([binary], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, fileName);
}
