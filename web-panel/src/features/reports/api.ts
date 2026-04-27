import { apiClient } from '../../lib/api-client';
import type { ReportHistoryItem } from '../../types/entities';

export type ReportHistoryQuery = {
  reportType?: 'equipment' | 'inventory-records';
};

export type CreateReportHistoryPayload = {
  reportType: 'equipment' | 'inventory-records';
  format: 'csv' | 'xlsx';
  snapshot: Record<string, unknown>;
  isPinned?: boolean;
};

export type UpdateReportHistoryPinPayload = {
  isPinned: boolean;
};

export const reportsApi = {
  async getHistory(params?: ReportHistoryQuery) {
    const { data } = await apiClient.get<ReportHistoryItem[]>(
      '/reports/history',
      {
        params,
      },
    );
    return data;
  },

  async createHistory(payload: CreateReportHistoryPayload) {
    const { data } = await apiClient.post<ReportHistoryItem>(
      '/reports/history',
      payload,
    );
    return data;
  },

  async setHistoryPinned(id: string, payload: UpdateReportHistoryPinPayload) {
    const { data } = await apiClient.patch<ReportHistoryItem>(
      `/reports/history/${id}/pin`,
      payload,
    );
    return data;
  },
};
