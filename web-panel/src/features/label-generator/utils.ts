import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import * as QRCode from 'qrcode';
import type { Equipment } from '../../types/entities';
import { downloadBlob } from '../../lib/download';
import type { LabelItem, LabelPrintMode, LabelSize } from './types';

const INVENTORY_HEADER_PATTERNS = [/инвентарн/i];
const NAME_HEADER_PATTERNS = [/наименован/i, /оборудован/i];
const NUMBER_HEADER_PATTERNS = [/^№$/i, /№\s*п\.?\s*п\.?/i, /п\.?\s*п\.?/i];
const SERIAL_HEADER_PATTERNS = [/серийн/i, /примечан/i];

function normalizeCell(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normalizeRow(row: string[]): string[] {
  return row.map(normalizeCell);
}

function matchesHeader(cell: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(cell));
}

function findColumnIndex(row: string[], patterns: RegExp[]): number {
  return row.findIndex((cell) => matchesHeader(cell, patterns));
}

function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell.trim().length === 0);
}

function makeItemId(sheetName: string, rowIndex: number): string {
  return `${sheetName}-${rowIndex}`;
}

export function equipmentToLabelItem(equipment: Equipment): LabelItem {
  return {
    id: equipment.id,
    number: '',
    name: equipment.name,
    inventoryNumber: equipment.inventoryNumber,
    serialNumber: equipment.serialNumber ?? '',
  };
}

export async function parseLabelWorkbook(file: File): Promise<LabelItem[]> {
  if (file.size === 0) {
    throw new Error('Файл пустой. Пожалуйста, выберите файл с данными.');
  }

  const validExtensions = ['.xlsx', '.xls'];
  const fileExtension = file.name
    .toLowerCase()
    .slice(file.name.lastIndexOf('.'));
  if (!validExtensions.includes(fileExtension)) {
    throw new Error(
      'Неверный формат файла. Пожалуйста, выберите файл формата .xlsx или .xls',
    );
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const items: LabelItem[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];

    let rowIndex = 0;
    while (rowIndex < rows.length) {
      const row = normalizeRow(rows[rowIndex] ?? []);
      const inventoryIndex = findColumnIndex(row, INVENTORY_HEADER_PATTERNS);

      if (inventoryIndex < 0) {
        rowIndex += 1;
        continue;
      }

      const numberIndex = findColumnIndex(row, NUMBER_HEADER_PATTERNS);
      const nameIndex = findColumnIndex(row, NAME_HEADER_PATTERNS);
      const serialIndex = findColumnIndex(row, SERIAL_HEADER_PATTERNS);
      const dataStartRow = rowIndex + 1;
      rowIndex += 1;

      while (rowIndex < rows.length) {
        const currentRow = normalizeRow(rows[rowIndex] ?? []);

        if (findColumnIndex(currentRow, INVENTORY_HEADER_PATTERNS) >= 0) {
          break;
        }

        if (isBlankRow(currentRow)) {
          if (items.length > 0) {
            break;
          }
          rowIndex += 1;
          continue;
        }

        const inventoryNumber = currentRow[inventoryIndex] ?? '';
        if (!inventoryNumber) {
          rowIndex += 1;
          continue;
        }

        const name = nameIndex >= 0 ? (currentRow[nameIndex] ?? '') : '';
        const serialNumber =
          serialIndex >= 0 ? (currentRow[serialIndex] ?? '') : '';
        const number = numberIndex >= 0 ? (currentRow[numberIndex] ?? '') : '';

        items.push({
          id: makeItemId(sheetName, dataStartRow + items.length),
          number: number || String(items.length + 1),
          name,
          inventoryNumber,
          serialNumber,
        });

        rowIndex += 1;
      }
    }
  }

  const validItems = items.filter((item) => item.inventoryNumber.length > 0);
  if (!validItems.length) {
    throw new Error(
      'В файле не найдено оборудования с инвентарными номерами. Убедитесь, что данные заполнены корректно.',
    );
  }

  return validItems;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' | 'right' = 'left',
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  const originalAlign = ctx.textAlign;

  ctx.textAlign = align;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const wordMetrics = ctx.measureText(word);

    if (wordMetrics.width > maxWidth) {
      if (line) {
        ctx.fillText(line.trim(), x, currentY);
        currentY += lineHeight;
        line = '';
      }

      let charLine = '';
      for (let charIndex = 0; charIndex < word.length; charIndex += 1) {
        const charTestLine = charLine + word[charIndex];
        const charMetrics = ctx.measureText(charTestLine);
        if (charMetrics.width > maxWidth && charLine) {
          ctx.fillText(charLine, x, currentY);
          charLine = word[charIndex];
          currentY += lineHeight;
        } else {
          charLine = charTestLine;
        }
      }

      if (charLine) {
        line = charLine;
      }
      continue;
    }

    const testLine = line + (line ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }

  ctx.textAlign = originalAlign;
  return currentY;
}

export async function generateLabelImage(
  item: LabelItem,
  size: LabelSize,
): Promise<string> {
  const inventoryNumber = item.inventoryNumber.trim();
  if (!inventoryNumber) {
    throw new Error('Инвентарный номер обязателен для генерации этикетки.');
  }

  const dpi = 300;
  const cmToPx = dpi / 2.54;

  const widthPx = size.width * cmToPx;
  const heightPx = size.height * cmToPx;
  const borderPx = size.borderMargin * cmToPx;
  const workWidthPx = widthPx - borderPx * 2;
  const workHeightPx = heightPx - borderPx * 2;

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Не удалось создать контекст canvas');
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, widthPx, heightPx);

  const startX = borderPx;
  const startY = borderPx;

  if (size.showBorder) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, startY, workWidthPx, workHeightPx);
  }

  const ptToPx = dpi / 72;
  const nameFontSizePx = size.nameFontSize * ptToPx;
  const fieldFontSizePx = size.fieldFontSize * ptToPx;

  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'top';

  const topText = size.showInventoryNumber ? inventoryNumber : '';
  const topTextY = startY + size.nameMargin * cmToPx;
  ctx.font = `bold ${nameFontSizePx}px "Times New Roman", serif`;
  const topTextMaxWidth = workWidthPx - 0.2 * cmToPx;
  const topLineHeight = nameFontSizePx * 1.2;
  const topTextBottomY = topText
    ? wrapText(
        ctx,
        topText,
        startX + workWidthPx / 2,
        topTextY,
        topTextMaxWidth,
        topLineHeight,
        'center',
      )
    : topTextY;

  const qrCodeDataUrl = await QRCode.toDataURL(inventoryNumber, {
    width: 200,
    margin: 1,
  });

  const qrImage = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImage.onload = () => resolve();
    qrImage.onerror = () => reject(new Error('Не удалось создать QR-код'));
    qrImage.src = qrCodeDataUrl;
  });

  let qrSizePx: number;
  if (size.qrAutoSize) {
    qrSizePx = Math.min(workHeightPx * 0.6, workWidthPx * 0.4);
  } else {
    qrSizePx = size.qrSize * cmToPx;
    qrSizePx = Math.min(
      qrSizePx,
      Math.min(workHeightPx * 0.8, workWidthPx * 0.5),
    );
  }

  const qrLeftMargin = 0.05 * cmToPx;
  const qrX = startX + qrLeftMargin;
  const minSpacing = 0.05 * cmToPx;
  const spacingPx =
    size.nameSpacing > 0 ? size.nameSpacing * cmToPx : minSpacing;
  const qrY = topTextBottomY + spacingPx;

  ctx.drawImage(qrImage, qrX, qrY, qrSizePx, qrSizePx);

  const textX = qrX + qrSizePx + size.textSpacing * cmToPx;
  const textWidthPx =
    workWidthPx -
    (qrX + qrSizePx - startX) -
    size.textSpacing * cmToPx -
    0.1 * cmToPx;

  const qrCenterY = qrY + qrSizePx / 2;
  const lineHeight = fieldFontSizePx * 1.3;
  const displayName = item.name.trim() || 'Не указано';
  const displaySerialNumber = item.serialNumber.trim();

  ctx.font = `bold ${fieldFontSizePx}px "Times New Roman", serif`;
  ctx.textAlign = 'left';

  const nameWords = displayName.split(' ');
  let tempLine = '';
  let nameLineCount = 0;

  for (let index = 0; index < nameWords.length; index += 1) {
    const word = nameWords[index];
    const wordMetrics = ctx.measureText(word);

    if (wordMetrics.width > textWidthPx) {
      if (tempLine) {
        nameLineCount += 1;
        tempLine = '';
      }
      let charLine = '';
      for (let charIndex = 0; charIndex < word.length; charIndex += 1) {
        const charTestLine = charLine + word[charIndex];
        const charMetrics = ctx.measureText(charTestLine);
        if (charMetrics.width > textWidthPx && charLine) {
          nameLineCount += 1;
          charLine = word[charIndex];
        } else {
          charLine = charTestLine;
        }
      }
      if (charLine) {
        nameLineCount += 1;
      }
    } else {
      const testLine = tempLine + (tempLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > textWidthPx && tempLine) {
        nameLineCount += 1;
        tempLine = word;
      } else {
        tempLine = testLine;
      }
    }
  }

  if (tempLine) {
    nameLineCount += 1;
  }

  if (nameLineCount === 0) {
    nameLineCount = 1;
  }

  let totalTextHeight = nameLineCount * lineHeight;

  if (size.showSerialNumber && displaySerialNumber) {
    totalTextHeight += lineHeight * 0.3;
    totalTextHeight += lineHeight * 2;
  }

  let textStartY = qrCenterY - totalTextHeight / 2;

  textStartY = wrapText(
    ctx,
    displayName,
    textX,
    textStartY,
    textWidthPx,
    lineHeight,
  );

  if (size.showSerialNumber && displaySerialNumber) {
    textStartY += lineHeight * 0.3;
    ctx.font = `bold ${fieldFontSizePx}px "Times New Roman", serif`;
    textStartY = wrapText(
      ctx,
      'Серийный номер:',
      textX,
      textStartY,
      textWidthPx,
      lineHeight,
    );

    ctx.font = `${fieldFontSizePx}px "Times New Roman", serif`;
    textStartY = wrapText(
      ctx,
      displaySerialNumber,
      textX,
      textStartY,
      textWidthPx,
      lineHeight,
    );
  }

  if (size.showDate) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const dateText = `Дата: ${dateStr}`;
    const dateFontSizePx = size.dateFontSize * ptToPx;
    ctx.font = `${dateFontSizePx}px "Times New Roman", serif`;
    ctx.textAlign = 'right';
    const dateX = startX + workWidthPx - 0.1 * cmToPx;
    const dateY = startY + workHeightPx - dateFontSizePx * 1.5 - 0.05 * cmToPx;
    ctx.fillText(dateText, dateX, dateY);
  }

  return canvas.toDataURL('image/png');
}

export async function generateLabelPdf(
  items: LabelItem[],
  size: LabelSize,
  printMode: LabelPrintMode,
): Promise<Blob> {
  if (!items.length) {
    throw new Error(
      'Не выбрано ни одного оборудования для генерации этикеток.',
    );
  }

  if (printMode === 'single') {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'cm',
      format: [size.width, size.height],
      compress: true,
    });

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (index > 0) {
        pdf.addPage([size.width, size.height], 'landscape');
      }

      const labelImageDataUrl = await generateLabelImage(item, size);
      pdf.addImage(labelImageDataUrl, 'PNG', 0, 0, size.width, size.height);
    }

    return pdf.output('blob');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'cm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 21;
  const pageHeight = 29.7;
  const marginX = 0.5;
  const marginY = 0.5;
  const gapX = 0.2;
  const gapY = 0.2;

  const columns = Math.max(
    1,
    Math.floor((pageWidth - marginX * 2 + gapX) / (size.width + gapX)),
  );
  const rows = Math.max(
    1,
    Math.floor((pageHeight - marginY * 2 + gapY) / (size.height + gapY)),
  );
  const itemsPerPage = columns * rows;

  for (let index = 0; index < items.length; index += 1) {
    if (index > 0 && index % itemsPerPage === 0) {
      pdf.addPage('a4', 'portrait');
    }

    const positionIndex = index % itemsPerPage;
    const column = positionIndex % columns;
    const row = Math.floor(positionIndex / columns);

    const x = marginX + column * (size.width + gapX);
    const y = marginY + row * (size.height + gapY);

    const labelImageDataUrl = await generateLabelImage(items[index], size);
    pdf.addImage(labelImageDataUrl, 'PNG', x, y, size.width, size.height);
  }

  return pdf.output('blob');
}

export async function downloadLabelPdf(
  items: LabelItem[],
  size: LabelSize,
  printMode: LabelPrintMode,
  fileName: string,
): Promise<void> {
  const blob = await generateLabelPdf(items, size, printMode);
  downloadBlob(blob, fileName);
}
