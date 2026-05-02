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
  equipment?: {
    id: string;
    inventoryNumber: string;
    name: string;
    serialNumber?: string | null;
    status?: OptionItem | null;
    type?: OptionItem | null;
    location?: OptionItem | null;
  } | null;
  scannedAt: string;
  statusAtEventTime: string;
  locationAtEventTime: string | null;
  comment: string | null;
  resultStatus: 'FOUND' | 'DAMAGED';
};

export type ReportHistoryItem = {
  id: string;
  createdBy: string;
  reportType: 'equipment' | 'inventory-records';
  title: string;
  format: 'csv' | 'xlsx';
  snapshot: Record<string, unknown>;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentAuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'STATUS_CHANGED'
  | 'LOCATION_CHANGED'
  | 'TYPE_CHANGED'
  | 'INVENTORY_SCANNED'
  | 'INVENTORY_RECORD_UPDATED'
  | 'DELETED';

export type EquipmentAuditEvent = {
  id: string;
  equipmentId: string;
  actorUserId: string | null;
  actorName: string | null;
  action: EquipmentAuditAction;
  summary: string;
  details: string | null;
  reason: string | null;
  fromState: Record<string, unknown> | null;
  toState: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};
