export type LabelSourceMode = 'file' | 'database';

export type LabelPrintMode = 'single' | 'a4';

export type LabelSize = {
  width: number;
  height: number;
  borderMargin: number;
  nameFontSize: number;
  fieldFontSize: number;
  nameMargin: number;
  nameSpacing: number;
  textSpacing: number;
  showDate: boolean;
  dateFontSize: number;
  qrAutoSize: boolean;
  qrSize: number;
  showBorder: boolean;
  showInventoryNumber: boolean;
  showSerialNumber: boolean;
};

export type LabelItem = {
  id: string;
  number: string;
  name: string;
  inventoryNumber: string;
  serialNumber: string;
};

export const DEFAULT_LABEL_SIZE: LabelSize = {
  width: 5.8,
  height: 4,
  borderMargin: 0.2,
  nameFontSize: 14,
  fieldFontSize: 9.3,
  nameMargin: 0.3,
  nameSpacing: 0,
  textSpacing: 0.1,
  showDate: false,
  dateFontSize: 6,
  qrAutoSize: true,
  qrSize: 1.5,
  showBorder: false,
  showInventoryNumber: true,
  showSerialNumber: false,
};
