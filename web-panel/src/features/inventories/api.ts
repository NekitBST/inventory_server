import { apiClient } from '../../lib/api-client';
import type { PaginatedResponse } from '../../types/common';
import type { Inventory, InventoryRecord } from '../../types/entities';

export type InventoriesQuery = {
  page: number;
  limit: number;
  status?: 'OPEN' | 'CLOSED';
  search?: string;
  sortOrder?: 'ASC' | 'DESC';
};

export type InventoryRecordsQuery = {
  page: number;
  limit: number;
  resultStatus?: 'FOUND' | 'DAMAGED';
  search?: string;
};

export const inventoriesApi = {
  async getAll(params: InventoriesQuery) {
    const { data } = await apiClient.get<PaginatedResponse<Inventory>>(
      '/inventories',
      {
        params,
      },
    );
    return data;
  },

  async close(id: string) {
    const { data } = await apiClient.patch<Inventory>(
      `/inventories/${id}/close`,
    );
    return data;
  },

  async getRecords(inventoryId: string, params: InventoryRecordsQuery) {
    const { data } = await apiClient.get<PaginatedResponse<InventoryRecord>>(
      `/inventory-records/by-inventory/${inventoryId}`,
      { params },
    );
    return data;
  },
};
