import ExcelJS from 'exceljs';
import { downloadBlob } from './download';

type ReportFormat = 'csv' | 'xlsx';

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
}: {
  rows: T[];
  columns: Array<ExportColumn<T>>;
  selectedColumnKeys: Array<keyof T>;
  format: ReportFormat;
  baseFileName: string;
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

  const stamp = formatStamp();

  if (format === 'csv') {
    const csvRows = [header, ...bodyRows].map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(';'),
    );
    const csv = csvRows.join('\n');
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

  const binary = await workbook.xlsx.writeBuffer();
  const fileName = `${baseFileName}_${stamp}.xlsx`;
  const blob = new Blob([binary], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, fileName);
}
