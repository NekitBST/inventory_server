import { apiClient } from '../../lib/api-client';
import type { PaginatedResponse } from '../../types/common';
import type {
  Equipment,
  EquipmentPayload,
  EquipmentAuditEvent,
} from '../../types/entities';

export type EquipmentQuery = {
  page: number;
  limit: number;
  search?: string;
  statusId?: number;
  typeId?: number;
  locationId?: number;
};

export type EquipmentReportQuery = {
  search?: string;
  statusId?: number;
  typeId?: number;
  locationId?: number;
};

export const equipmentApi = {
  async getAll(params: EquipmentQuery) {
    const { data } = await apiClient.get<PaginatedResponse<Equipment>>(
      '/equipment',
      {
        params,
      },
    );
    return data;
  },

  async create(payload: EquipmentPayload) {
    const { data } = await apiClient.post<Equipment>('/equipment', payload);
    return data;
  },

  async update(id: string, payload: Partial<EquipmentPayload>) {
    const { data } = await apiClient.patch<Equipment>(
      `/equipment/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: string) {
    await apiClient.delete(`/equipment/${id}`);
  },

  async exportReport(params: EquipmentReportQuery) {
    const response = await apiClient.get<Blob>('/reports/equipment/export', {
      params,
      responseType: 'blob',
    });
    return response;
  },

  async getTimeline(id: string) {
    const { data } = await apiClient.get<EquipmentAuditEvent[]>(
      `/equipment/${id}/timeline`,
    );
    return data;
  },
};
