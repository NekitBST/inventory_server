import { apiClient } from '../../lib/api-client';
import type { OptionItem } from '../../types/common';

export type ReferenceModule =
  | 'locations'
  | 'equipment-types'
  | 'equipment-statuses';

export const referencesApi = {
  async getAll(module: ReferenceModule) {
    const { data } = await apiClient.get<OptionItem[]>(`/${module}`);
    return data;
  },

  async create(module: ReferenceModule, payload: { name: string }) {
    const { data } = await apiClient.post<OptionItem>(`/${module}`, payload);
    return data;
  },

  async update(module: ReferenceModule, id: number, payload: { name: string }) {
    const { data } = await apiClient.patch<OptionItem>(
      `/${module}/${id}`,
      payload,
    );
    return data;
  },

  async remove(module: ReferenceModule, id: number) {
    await apiClient.delete(`/${module}/${id}`);
  },
};
