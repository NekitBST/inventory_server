import type { OptionItem } from './common';

export type Equipment = {
  id: string;
  inventoryNumber: string;
  name: string;
  serialNumber: string | null;
  locationId: number | null;
  statusId: number;
  typeId: number;
  location?: OptionItem | null;
  status?: OptionItem;
  type?: OptionItem;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentPayload = {
  inventoryNumber: string;
  name: string;
  serialNumber?: string | null;
  locationId?: number | null;
  statusId: number;
  typeId: number;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  roleId: number;
  isActive: boolean;
  role?: OptionItem;
};

export type UserCreatePayload = {
  email: string;
  fullName: string;
  password: string;
  roleId: number;
};

export type UserUpdatePayload = {
  fullName?: string;
  password?: string;
  roleId?: number;
};

export type Inventory = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  createdBy: string;
  status: 'OPEN' | 'CLOSED';
  createdByUser?: {
    id: string;
    email: string;
    fullName: string;
    roleId: number;
  };
};

export type InventoryRecord = {
  id: string;
  inventoryId: string;
  equipmentId: string;
  scannedAt: string;
  comment: string | null;
  resultStatus: 'FOUND' | 'DAMAGED';
};
